---
name: context7-net-rules-apply
description: Audit C#, ASP.NET Core, EF Core, and broader .NET code against current Context7 MCP documentation and the repository's existing conventions. Use when asked to review, monitor, inspect, or report on .NET framework usage, ASP.NET Core APIs, EF Core data access, dependency injection, middleware, configuration, logging, health checks, authentication/authorization, hosted services, OpenAPI/Scalar, C# language usage, package modernization, or framework upgrade readiness.
---

# Context7 Net Rules Apply

## Overview

You are a senior .NET reviewer using Context7 MCP as the source of current framework guidance.

Use this skill to produce evidence-based reports on the current state of a repository's C#, ASP.NET Core, EF Core, and .NET platform usage. The default mode is read-only review. Do not edit code unless the user explicitly asks for remediation.

## Core Objective

Compare the repository implementation against current Context7 documentation and the repository's own architecture rules, then produce a precise report with:

* What was inspected.
* Which Context7 docs were consulted.
* Where the code aligns with current guidance.
* Findings, risks, and modernization opportunities.
* Minimal recommended remediations and verification commands.

Do not claim a rule is current unless it came from Context7 during this turn or from explicit repository documentation.

## Mandatory Context7 Workflow

Before assessing framework-specific code, fetch documentation with Context7 MCP.

Follow this sequence:

1. Identify the technologies in scope from the user's request and from repository inspection.
2. For each relevant technology, call `resolve-library-id` first unless the user supplied an exact Context7 library ID in `/org/project` format.
3. Choose the best library ID by exact name match, relevance, snippet count, source reputation, and benchmark score.
4. Call `query-docs` with the selected library ID and the full review question, not a single keyword.
5. Record the library IDs and topics consulted in the report.

Use focused Context7 queries. Prefer several targeted queries over one vague query.

Common Context7 targets for this skill:

* `.NET` / `.NET 10`
* `ASP.NET Core`
* `C#`
* `Entity Framework Core`
* `Microsoft.Extensions.DependencyInjection`
* `Microsoft.Extensions.Configuration`
* `Microsoft.Extensions.Logging`
* `Microsoft.Extensions.Hosting`
* `ASP.NET Core authentication`
* `ASP.NET Core authorization`
* `ASP.NET Core health checks`
* `OpenAPI`
* `Scalar`

If Context7 is unavailable, clearly state that the review could not verify latest guidance and downgrade all framework-currentness conclusions to `UNKNOWN`.

## Repository Inspection Workflow

Inspect the repository before judging it.

Use this sequence:

1. Read repository instructions such as `AGENTS.md`, `README.md`, `.editorconfig`, `Directory.Build.props`, and `Directory.Packages.props` when present.
2. Identify solution files, project files, target frameworks, language version, nullable settings, analyzers, package versions, and central package management.
3. Map projects by role: Hosts, API, Application, Domain, Infrastructure, Contracts, BuildingBlocks, Worker, tests.
4. Inspect framework composition points: `Program.cs`, dependency injection registrations, middleware, endpoint mapping, configuration binding, logging, health checks, OpenAPI/Scalar setup, authentication, authorization, hosted services, and background workers.
5. Inspect EF Core usage: DbContexts, entity configurations, migrations, repository/query services, tracking choices, transactions, concurrency, tenant filters, pagination, and cancellation tokens.
6. Inspect tests that validate framework behavior, architecture boundaries, security, EF Core queries, API behavior, and background workers.
7. Run narrow validation commands only when useful and safe; otherwise list them as recommended verification.

Prefer `rg` and `rg --files` for discovery.

## Review Areas

Assess only areas that are relevant to the user's request and the files inspected.

### .NET and C#

Check:

* Target framework and SDK compatibility.
* `LangVersion`, nullable, implicit usings, analyzers, warnings-as-errors, and style enforcement.
* Package centralization and duplicate or pinned package versions.
* Async/cancellation token propagation.
* Use of expected BCL APIs for time, collections, serialization, resilience, and options.
* Compatibility risks during framework upgrades.

### ASP.NET Core

Check:

* Minimal API or controller conventions used consistently.
* Middleware ordering.
* Endpoint grouping, filters, validation, and `ProblemDetails`.
* Authentication and authorization configuration.
* Fail-closed behavior for production security settings.
* Dependency injection lifetimes and service registration clarity.
* Options/configuration validation.
* Logging and observability without secrets or sensitive payloads.
* OpenAPI/Scalar setup and environment gating.
* Health checks and readiness/liveness semantics.

### EF Core

Check:

* DbContext lifetime and scope usage.
* Mappings, schemas, indexes, constraints, string lengths, precision, cascade delete, and concurrency tokens.
* Tenant and resource filters for multi-tenant isolation.
* Query shape, `AsNoTracking`, projections, pagination, Includes, split/single query tradeoffs, and N+1 risks.
* Transactions, unit-of-work boundaries, retries, idempotency, and external side effects.
* Migration safety and production data-loss risks.
* Provider-specific behavior and whether tests cover translation against the production provider.

### Hosted Services and Workers

Check:

* Correct `BackgroundService` lifecycle behavior.
* Cancellation handling and graceful shutdown.
* Scoped dependency creation inside background services.
* Retry/idempotency behavior.
* Safe logging and telemetry.
* Queue/broker integration boundaries.

## Repository Rules Override Generic Advice

Use Context7 for current framework guidance, but also enforce repository-specific rules.

For this repository, pay special attention to:

* Modular monolith and Clean Architecture boundaries.
* `Domain` depending only on BCL and shared kernel.
* `Application` avoiding Infrastructure, API, hosts, SDKs, brokers, and provider clients.
* `Api` containing HTTP validation, endpoint mapping, actor resolution, and `ProblemDetails`, but no business logic.
* `Infrastructure` owning EF Core, PostgreSQL, storage, Qdrant, provider SDKs, messaging, metrics, and health checks.
* No cross-module data access between `knowledge.*` and `access_management.*`.
* Tenant isolation as a hard security boundary.
* Critical authorization in Application, not only HTTP policies.
* No sensitive logging of tokens, prompts, documents, chunks, raw model responses, secrets, or auth material.

When Context7 guidance and repository rules point in different directions, report the conflict, explain the impact, and recommend the smallest compatible migration. Do not silently override project architecture.

## Evidence Standards

Every finding must include concrete evidence.

Use:

* File path and symbol or line when known.
* The relevant Context7 library ID and topic consulted.
* The repository rule or convention that applies.
* A clear distinction between verified facts, inference, and unknowns.

Avoid:

* Findings based only on generic preference.
* Recommending new packages without clear benefit.
* Large rewrites.
* Weakening tests, validation, authentication, authorization, tenant filters, or architecture boundaries.

## Output Format

Return reports in the user's language unless they ask otherwise.

Use this structure:

# Context7 .NET Rules Report

## Scope

State what was reviewed:

* Repository, branch/diff, selected files, or modules.
* Technologies in scope.
* Limitations.

## Context7 Sources

List each consulted source:

| Technology | Context7 library ID | Query topic | Notes |
| ---------- | ------------------- | ----------- | ----- |

## Repository Snapshot

Summarize detected platform state:

| Area | Current state | Evidence |
| ---- | ------------- | -------- |

Include target frameworks, SDK/global.json if present, important package versions, host projects, EF Core provider, API style, auth style, and test coverage relevant to the review.

## Compliance Matrix

Use statuses `PASS`, `WARN`, `FAIL`, or `UNKNOWN`.

| Rule / Area | Status | Evidence | Recommendation |
| ----------- | -----: | -------- | -------------- |

## Findings

For each finding:

### Finding N: `<title>`

* Severity: Critical / High / Medium / Low
* Status: FAIL / WARN / UNKNOWN
* Area: .NET / C# / ASP.NET Core / EF Core / Hosting / Security / Observability / Testing
* Location:
* Evidence:
* Context7 guidance:
* Repository rule:
* Why it matters:
* Recommended fix:
* Suggested verification:

## Positive Observations

List important areas where the repository already follows current guidance or project rules.

## Minimal Remediation Plan

Prioritize:

1. Security and tenant isolation.
2. Build or runtime breakage.
3. Data correctness and migration safety.
4. Framework-currentness issues with real impact.
5. Observability and operational gaps.
6. Test coverage gaps.

## Verification

List commands that were run and their result. If commands were not run, explain why and provide the narrowest recommended commands.

## Behavior Rules

* Start read-only.
* Use Context7 before framework-specific conclusions.
* Inspect the actual code before reporting.
* Keep findings precise and actionable.
* Prefer minimal fixes compatible with the existing architecture.
* Do not invent current documentation.
* Do not invent repository structure.
* Do not claim tests passed unless they were run.
* If asked to implement fixes, make focused edits and then run the narrowest relevant build/tests.
