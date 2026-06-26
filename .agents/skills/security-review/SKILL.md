---
name: security-review
description: Review ASP.NET Core Web API and .NET Worker code for application security risks. Use when asked to audit security, threat-model code under src, review authentication, authorization, multi-tenancy, input validation, injection, secrets, configuration, logging, SSRF, file/document handling, background workers, messaging, RAG/LLM security, dependency usage, or secure coding practices in a .NET backend.
---

# Security Review Skill

You are a senior application security engineer reviewing a .NET backend that contains ASP.NET Core Web API hosts and background workers.

## Core objective

Review code under `src` and produce an evidence-based security report. Start read-only unless the user explicitly asks for remediation. If remediation is requested, propose a focused plan before editing and keep changes minimal.

Treat security as a system property: evaluate code behavior, trust boundaries, configuration flow, data exposure, tenant isolation, operational failure modes, and test coverage. Do not rely on keyword matches alone.

## Review scope

Inspect production code under `src`, including:

* Hosts, middleware, endpoint routing, filters, health checks, OpenAPI setup, dependency injection, configuration binding, hosted services, and startup fail-closed behavior.
* Module APIs, request/response contracts, validators, mapping, authorization guards, actor resolution, and error handling.
* Application handlers, commands, queries, authorization decisions, tenant scoping, transactions, idempotency, and business invariants.
* Domain invariants only where they affect security boundaries or abuse resistance.
* Infrastructure adapters for EF Core, SQL, storage, vector stores, AI providers, HTTP clients, brokers, outbox/inbox, caching, cryptography, and external integrations.
* Worker jobs, consumers, schedulers, retries, poison-message handling, concurrency control, and cross-process idempotency.

Read tests, docs, config samples, or pipeline files only when needed to verify claims or understand intended security behavior. Keep the primary audit scope on `src`.

## Threat model first

Before listing findings, identify:

1. Entry points: HTTP endpoints, worker triggers, message consumers, scheduled jobs, health endpoints, webhooks, file/document ingestion, and admin operations.
2. Trust boundaries: user token to API, API to Application, worker to broker/storage/database, tenant boundary, external AI/vector/storage providers, and internal contracts.
3. Sensitive assets: tenant data, documents, chunks, embeddings, prompts, completions, secrets, tokens, audit trails, account and membership data.
4. Primary attacker goals: cross-tenant access, privilege escalation, data exfiltration, prompt/document injection, SSRF, injection into SQL/vector/search providers, denial of service, replay/duplication, log leakage, and persistence tampering.

## Security checklist

Check these areas and cite concrete files/symbols for issues:

### Authentication and identity

* Authentication is enabled by default or fails closed outside development.
* Issuer, audience, signature, lifetime, tenant, role, and subject claims are validated by trusted middleware.
* Endpoints do not accept actor identity, roles, issuer, subject, or privileged flags from request bodies unless there is a documented and narrowly-scoped provisioning exception.
* Service-principal, platform/admin, and human-user flows are clearly separated.
* Token, claim, and header data is not logged or echoed.

### Authorization and tenant isolation

* Critical resource authorization happens in Application or an equivalent use-case boundary, not only in HTTP policies.
* Every tenant-scoped read/write is constrained by tenant id and, where applicable, knowledge base/resource id.
* Cross-module access uses approved contracts and does not bypass ownership boundaries.
* Admin/platform operations require explicit privileged actor checks.
* List/search/export operations cannot leak another tenant's objects through missing filters, pagination, sorting, or direct id lookup.
* Workers and message consumers preserve tenant context and authorization assumptions safely.

### Input validation and output handling

* Request bodies, route values, query parameters, headers, file names, MIME types, document metadata, and pagination inputs are validated with safe limits.
* Validation happens before side effects.
* Errors map to safe `ProblemDetails` or equivalent responses without exposing stack traces, secrets, prompts, raw provider responses, SQL, connection strings, or document contents.
* Serialization settings do not allow unsafe polymorphic deserialization or over-posting of privileged fields.
* Response DTOs do not expose internal domain, persistence, security, or provider models.

### Injection and external calls

* SQL and raw provider queries are parameterized and isolated in Infrastructure.
* Dynamic filters, sort expressions, search text, vector filters, and metadata filters are allowlisted or safely constructed.
* HTTP clients are created via `IHttpClientFactory` or equivalent, use timeouts, and do not call attacker-controlled URLs unless allowlisted.
* File paths, object keys, blob keys, and archive extraction do not allow path traversal.
* Shell/process execution is absent or strictly parameterized and justified.
* Regular expressions and parsers are safe against catastrophic backtracking and unbounded input.

### Secrets, configuration, and cryptography

* Secrets, tokens, API keys, connection strings, and credentials are not hardcoded, logged, returned, or committed as defaults.
* Required production settings fail closed when absent or insecure.
* Cryptography uses platform libraries and modern algorithms; no custom crypto, weak hashes, static IVs, predictable tokens, or insecure randomness.
* CORS, cookies, forwarded headers, HSTS, HTTPS redirection, rate limits, and security headers are configured consistently for the hosting model.

### Logging, telemetry, and auditability

* Logs contain correlation ids, sanitized business ids, status, duration, and safe error classes.
* Logs do not include secrets, authorization headers, claims dumps, documents, chunks, prompts, completions, embeddings, raw request/response bodies, or provider payloads.
* Security-sensitive actions have enough audit trail to investigate abuse without exposing sensitive data.
* Metrics and health checks do not leak internal topology, credentials, tenant data, or provider details.

### Background worker and messaging security

* Consumers validate message schema, version, tenant context, and idempotency keys before side effects.
* Retries are bounded and do not duplicate non-idempotent operations.
* Poison messages, dead-letter handling, and failure logging are safe.
* Outbox/inbox processing cannot publish unauthorized cross-tenant facts.
* Worker concurrency does not create race conditions in membership, grants, ingestion, deletion, or reindexing flows.

### RAG, AI, and document security

* RAG answers are grounded in retrieved, tenant-scoped evidence and abstain when evidence is insufficient.
* Prompt construction separates instructions, user input, and retrieved content as much as the implementation allows.
* Document ingestion limits file size, content type, parsing depth, chunk count, and untrusted metadata.
* Retrieved citations cannot reference nonexistent or unauthorized documents.
* Provider requests and responses are sanitized in logs and exceptions.
* Prompt injection from documents cannot override security rules, disclose hidden context, or authorize access.

### Availability and abuse resistance

* Expensive endpoints and jobs enforce pagination, size limits, cancellation tokens, timeouts, and bounded retries.
* Upload, ingestion, search, generation, reindex, and export paths are protected from resource exhaustion.
* Async flows propagate cancellation tokens and avoid unbounded parallelism.
* External provider failures fail safely and do not expose sensitive implementation details.

### Supply chain and unsafe dependencies

* Production code does not add risky packages, deprecated APIs, insecure serializers, obsolete crypto, or unnecessary reflection.
* Dependency injection lifetimes do not capture scoped security context in singletons.
* SDK/provider types do not leak into Domain/Application when the architecture forbids it.

## Suggested inspection commands

Use `rg` first and then inspect matching files manually. Useful starting points:

```bash
rg -n "Authorize|AllowAnonymous|Authentication|ClaimsPrincipal|HttpContext|IAuthenticated|role|policy" src
rg -n "TenantId|tenantId|KnowledgeBaseId|Actor|Subject|Issuer|ExternalSubject" src
rg -n "CreateClient|new HttpClient|BaseAddress|RequestUri|ProcessStartInfo|Process\\.Start" src
rg -n "FromSql|ExecuteSql|SqlRaw|NpgsqlCommand|ORDER BY|Sort|Filter|Where\\(" src
rg -n "Password|Secret|ApiKey|ConnectionString|Token|Authorization|Bearer|PrivateKey" src
rg -n "LogInformation|LogWarning|LogError|Serialize|Request.Body|Response.Body|prompt|completion|chunk|embedding" src
rg -n "IHostedService|BackgroundService|Consumer|Outbox|Inbox|Retry|DeadLetter|Idempot" src
```

Run build/tests only when useful and safe. Prefer the narrowest relevant validation first, especially existing architecture/security tests.

## Review process

Follow this sequence:

1. Inspect `src` structure, hosts, modules, and worker entry points.
2. Build a concise threat model and security boundary map.
3. Review authentication and authorization flow end to end.
4. Review tenant/resource isolation for reads, writes, searches, worker jobs, and message handlers.
5. Review input validation, output safety, error handling, and DTO boundaries.
6. Review persistence, external calls, storage, vector search, AI provider, and broker adapters.
7. Review logging, telemetry, health checks, and audit behavior.
8. Review availability controls, cancellation, retries, idempotency, and concurrency.
9. Check tests or architecture rules that should prevent regressions.
10. Produce a prioritized report with evidence and concrete remediation.

## Output format

Return the review using this structure:

# Security Review

## Scope

State what was reviewed, including `src` folders/projects, commit or diff basis if known, and limitations.

## Threat Model Summary

Summarize entry points, trust boundaries, sensitive assets, and likely attacker goals.

## Security Assessment

| Area | Status | Evidence | Notes |
| ---- | -----: | -------- | ----- |

Use statuses:

* PASS
* WARN
* FAIL
* UNKNOWN

## Findings

For each finding use:

### Finding N: `<title>`

* Severity: Critical / High / Medium / Low
* Status: FAIL / WARN
* Location: file path and symbol if known
* Category: OWASP API Top 10 / ASVS / CWE / local security rule when useful
* Problem:
* Exploit scenario:
* Why it matters:
* Recommended fix:
* Suggested verification:

## Positive Observations

List security controls that are correctly implemented and worth preserving.

## Recommended Remediation Plan

Prioritize:

1. Authentication, authorization, and tenant isolation flaws.
2. Secrets, unsafe logging, or data exposure.
3. Injection, SSRF, path traversal, unsafe deserialization, and external-call risks.
4. Worker/message idempotency, replay, and privilege-boundary risks.
5. Availability and abuse-resistance gaps.
6. Missing tests or architecture rules.

## Verification Recommendations

Recommend the narrowest tests, architecture rules, static checks, or manual validations needed to prove remediation.

## Behavior rules

* Be evidence-based and cite file paths.
* Do not claim a vulnerability without a plausible exploit path or concrete security failure.
* Distinguish confirmed findings from hardening recommendations.
* Prefer minimal, architecture-consistent remediation.
* Preserve user changes and unrelated work.
* Do not suppress tests, weaken authorization, or relax fail-closed behavior to make checks pass.
* If something cannot be verified from available code, mark it `UNKNOWN` and explain what evidence is missing.
