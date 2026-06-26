# API Testing Notes

This SPA exists to test the RagPymes backend API from a React + Vite frontend.

Use `../rag-pymes-backend/` as the source of truth for API contracts. Before adding or changing frontend API calls, check backend route definitions, DTOs, validation rules, authentication behavior, and available OpenAPI or Postman artifacts.

The current endpoint catalog is loaded from `src/data/postmanCollection.json`, copied from `../rag-pymes-backend/postman/RagPymes.Api - v1.documented.postman_collection.json`. The formal operation contract is read from `api-definition/RagPymes-v1.json`.

## Frontend Structure

The SPA now follows a guided demo structure:

- `src/api/` contains the typed RagPymes API layer: configuration, HTTP client, DTO contracts, API errors, and domain methods.
- `src/components/layout/` contains `AppShell`, `Header`, and `MainContent`.
- `src/components/shared/` contains reusable presentation components such as `SectionCard`.
- `src/pages/HomePage.tsx` introduces the API testing purpose and routes users into the demo.
- `src/features/ragPymesApiDemo/` contains the RagPymes testing experience, including guided Access Management and Knowledge flows.
- `src/features/ragPymesApiDemo/components/EndpointExplorer.tsx` preserves the full Postman/OpenAPI endpoint explorer as the advanced testing tool.
- `src/styles/globals.css` owns base tokens and global element defaults; component styling should use CSS Modules.

Do not encode guessed backend behavior in the frontend. If an endpoint, payload, or response shape is unclear, inspect the backend first and document the confirmed behavior here.

## Typed API Layer

Use `src/api/ragPymesApi.ts` for application flows instead of hand-written `fetch` calls. The methods are grouped by domain:

- `ragPymesApi.health` for `/health`, `/health/live`, and `/health/ready`.
- `ragPymesApi.accessManagement` for tenant registration, provisioning, invitations, memberships, and knowledge base grants.
- `ragPymesApi.platformAdministration` for platform tenant listing, suspension, and reactivation.
- `ragPymesApi.knowledge` for knowledge bases, document upload, ingestion runs, reindexing, search, and answers.

Configure the API through Vite env vars:

```bash
VITE_RAGPYMES_API_BASE_URL=http://localhost:5088
VITE_RAGPYMES_API_TIMEOUT_MS=30000
```

Example usage:

```ts
import { setAccessTokenGetter } from '../api/httpClient';
import { ragPymesApi } from '../api/ragPymesApi';

setAccessTokenGetter(() => sessionStorage.getItem('ragpymes_access_token'));

const ready = await ragPymesApi.health.getReadyHealth();
const tenants = await ragPymesApi.accessManagement.listMyTenants();
```

`src/api/httpClient.ts` handles query params, JSON bodies, `FormData`, optional Bearer tokens, request timeouts, and external `AbortSignal`s. `src/api/apiError.ts` parses `ProblemDetails`; catch `ApiHttpError` to inspect `status`, `problem`, and the original payload.

Document uploads should use `ragPymesApi.knowledge.uploadKnowledgeDocument(...)`; it builds the `FormData` payload expected by OpenAPI. Keep the endpoint explorer available for advanced/manual API testing and for comparing raw Postman examples against the typed layer.

The advanced endpoint explorer must remain behind the guided flows. It reuses the global API base URL, Bearer token, and shared demo variables from `HomePage`, and it executes requests through `httpClient.execute(...)` so JSON, timeouts, auth, query params, and `FormData` stay consistent with the typed API layer. The local OpenAPI contract and Postman collection are expected to expose the same endpoint count; the current baseline is 34 OpenAPI endpoints and 34 Postman endpoints.

## Shared Demo Variables

The guided Access Management and Knowledge panels share editable variables so one API response can feed the next request:

- `tenantId`: captured from register/provision tenant, get tenant, list tenants, invitations, or memberships responses.
- `membershipId`: captured from owner membership, accepted invitation membership, list memberships, or change role responses.
- `invitationId`: captured from create/list/accept/revoke invitation responses.
- `invitationToken`: captured from `CreateTenantInvitationResponse.invitationToken` and reused by accept invitation.
- `knowledgeBaseId`: captured from create/get/list knowledge base responses, document metadata, or upload responses.
- `documentId`: captured from upload/get/reindex document responses, ingestion runs, or search results.
- `ingestionRunId`: captured from upload, reindex, get ingestion run, get document latest ingestion run, or list ingestion runs.

These variables are UI state only; they are not persisted. Users can overwrite them manually before running any guided action. Tenant roles are limited to the roles documented in Postman: `TenantOwner`, `TenantAdmin`, and `TenantMember`.

The guided Access Management panel intentionally does not send authenticated actor fields for self-service tenant registration. Postman states that issuer, subject, actor ID, and role for `RegisterTenant` come from the Bearer token, so the form only sends `companyName`, `slug`, and `contactEmail`.

The guided Knowledge panel uses the typed API layer for knowledge bases, document upload, ingestion runs, semantic search, and grounded answers. Uploads go through `ragPymesApi.knowledge.uploadKnowledgeDocument(...)`, which creates `FormData` and lets the browser set multipart boundaries and `Content-Type`.

Search and answer filters are optional JSON objects with string values, for example `{"tipo":"contrato"}`. The UI displays search results, answer citations, and metadata when the API returns them, but it does not write documents, tokens, or prompts to application logs.

## Manual Operating Flows

Use these flows from a desktop browser. Do not paste real secrets, production tokens, full customer documents, or sensitive prompts into screenshots, logs, issues, or comments.

### 1. Start and Configure the SPA

1. Start the frontend.

   ```bash
   npm run dev
   ```

   Expected result: Vite serves the SPA locally.

2. Start or connect to the RagPymes backend outside this workspace.

   Expected result: the API is reachable at the base URL used by the SPA, for example `http://localhost:5088`.

3. In the **Health checks** panel, set:

   - `API base URL`: backend URL.
   - `Bearer token opcional`: only if testing protected endpoints.

   Expected result: the same base URL and token are reused by guided flows and the advanced endpoint explorer.

### 2. Health Smoke Flow

1. Run `GET /health/live`.
2. Run `GET /health/ready`.
3. Run `GET /health`.

Expected result: each check shows HTTP status, latency, and payload. If the backend is stopped or CORS blocks the request, the UI should show a normalized error.

### 3. Tenant Flow

1. Open **Access Management**.
2. Run `RegisterTenant` when using self-service authentication, or `ProvisionTenant` when using the technical provisioning identity.
3. Confirm that `tenantId` is captured in shared variables.
4. Run `ListTenants` or `GetTenant`.

Expected result: tenant responses populate shared variables and ProblemDetails errors are readable. Do not send issuer, subject, actor ID, or roles in self-service registration; those fields come from the token.

### 4. Knowledge Base Flow

1. Open **Knowledge**.
2. Confirm `tenantId` is populated.
3. Run `CreateKnowledgeBase`.
4. Confirm that `knowledgeBaseId` is captured.
5. Run `ListKnowledgeBases` and `GetKnowledgeBase`.

Expected result: the created or selected knowledge base can be reused by document, search, and answer flows.

### 5. Document Upload and Ingestion Flow

1. Select a small synthetic test file in **Upload document**.
2. Run `UploadKnowledgeDocument`.
3. Confirm that `documentId` and, when returned, `ingestionRunId` are captured.
4. Run `GetKnowledgeDocument`.
5. Run `ListDocumentIngestionRuns`.
6. Run `GetIngestionRun` only when `ingestionRunId` is known.

Expected result: uploads use real `FormData`. The browser sets multipart boundaries and `Content-Type`; do not set multipart headers manually.

### 6. Search and Answer Flow

1. Confirm `tenantId` and `knowledgeBaseId` are populated.
2. Run `SearchKnowledge` with a short test query and `topK=3`.
3. Optionally add filters as a JSON object with string values, for example `{"tipo":"contrato"}`.
4. Run `GenerateKnowledgeAnswer` with a non-sensitive question.

Expected result: search results, citations, answer text, and metadata are displayed when the API returns them. Do not assume ingestion states beyond the contract.

### 7. Advanced Endpoint Explorer

Use the advanced explorer only after the guided flows when you need an endpoint not covered by a panel or want to compare raw Postman examples with the OpenAPI contract.

1. Select an endpoint from the explorer list.
2. Review **Postman description** and **OpenAPI contract**.
3. Fill path variables, query params, request body, or multipart fields.
4. Send the request.

Expected result: the explorer preserves all Postman endpoints, reuses global connection settings and shared variables, and displays status, headers, URL, and body.

## Smoke Test Checklist

Run this checklist after refreshing API artifacts, changing the API layer, or modifying guided flows.

| Area | Action | Expected Result |
| --- | --- | --- |
| Health | Run `/health/live`, `/health/ready`, and `/health`. | API returns health payloads or clear normalized errors. |
| Tenant | Register or provision a tenant in a non-production environment. | `tenantId` is captured and can be used by later flows. |
| Knowledge base | Create, list, and get a knowledge base. | `knowledgeBaseId` is captured and responses match OpenAPI. |
| Document upload | Upload a small synthetic file. | `documentId` is captured; multipart upload succeeds without manual `Content-Type`. |
| Search | Run `SearchKnowledge` with `topK=3`. | Results or a valid empty response are displayed without leaking sensitive data. |
| Answer | Run `GenerateKnowledgeAnswer` with a non-sensitive question. | Answer, citations, and metadata render when returned. |

## Refreshing API Artifacts

Refresh both local artifacts whenever backend routes, DTOs, examples, authentication behavior, or operation metadata changes.

### Postman Collection

Source of truth:

```text
../rag-pymes-backend/postman/RagPymes.Api - v1.documented.postman_collection.json
```

Refresh command from this frontend workspace:

```bash
cp "../rag-pymes-backend/postman/RagPymes.Api - v1.documented.postman_collection.json" src/data/postmanCollection.json
```

Then run the SPA and verify that the advanced explorer still lists the expected endpoint count.

### OpenAPI Contract

When the backend is running in `Development`, it maps OpenAPI at:

```text
http://localhost:5088/openapi/v1.json
```

Refresh command:

```bash
curl -fsS http://localhost:5088/openapi/v1.json -o api-definition/RagPymes-v1.json
```

If the backend is running on another port, change the base URL. If the OpenAPI document name changes, inspect the backend `MapOpenApi()` configuration before refreshing.

### Artifact Parity Check

After refreshing, compare endpoint counts:

```bash
node -e "const api=require('./api-definition/RagPymes-v1.json');const postman=require('./src/data/postmanCollection.json');const methods=new Set(['get','post','put','patch','delete','head','options']);let openapi=0;for(const p of Object.values(api.paths))for(const m of Object.keys(p))if(methods.has(m))openapi++;function walk(items){let n=0;for(const item of items||[]){if(item.item)n+=walk(item.item);else if(item.request?.method&&item.request?.url?.raw)n++;}return n;}console.log({openapiEndpoints:openapi,postmanEndpoints:walk(postman.item)});"
```

Current baseline:

```text
openapiEndpoints: 34
postmanEndpoints: 34
```

## Repeatable Scenarios and Seed Scripts

No seed scripts were added in this phase. A seed script is useful only after the backend exposes a stable, repeatable non-production flow for:

- authentication or development auth bypass;
- tenant creation or cleanup;
- knowledge base creation;
- upload of synthetic test documents;
- ingestion completion or polling strategy;
- deterministic search and answer assertions.

Proposed future scripts, pending backend confirmation:

| Script | Purpose | Preconditions |
| --- | --- | --- |
| `npm run seed:ragpymes-demo` | Create a tenant, knowledge base, and synthetic document set. | Stable backend seed contract and safe cleanup path. |
| `npm run smoke:ragpymes-api` | Run health plus one tenant, knowledge base, search, and answer smoke path. | Token or development auth mode available through placeholders. |

Do not implement these scripts until the backend flow is confirmed and the user approves the contract.

## Troubleshooting

| Problem | Possible Cause | Fix |
| --- | --- | --- |
| Health check cannot connect. | Backend is stopped, wrong port, or CORS blocks the browser request. | Start the backend and verify the base URL. |
| Protected endpoint returns `401`. | Missing or expired Bearer token. | Paste a valid non-production token in the Health checks panel. |
| Protected endpoint returns `403`. | Token lacks required role or tenant permission. | Use an actor with the documented permission for that endpoint. |
| Multipart upload fails. | File missing or backend rejected content. | Select a small synthetic file and inspect ProblemDetails. |
| Search or answer returns no results. | Document ingestion has not completed or filters are too restrictive. | Check ingestion runs and simplify filters. |

## Related Files

| File | Purpose |
| --- | --- |
| `README.md` | Root project overview and Markdown index. |
| `AGENTS.md` | Contributor and agent operating rules. |
| `docs/spa-demo-test.md` | Execution plan for the SPA demo phases. |
| `src/data/postmanCollection.json` | Local Postman collection consumed by the advanced explorer. |
| `api-definition/RagPymes-v1.json` | Local OpenAPI contract used for typed API context and explorer metadata. |
| `src/api/httpClient.ts` | Shared HTTP execution, auth, JSON, timeout, query, and `FormData` handling. |
| `src/api/ragPymesApi.ts` | Typed domain API wrapper used by guided flows. |
