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
- `src/features/ragPymesApiDemo/` contains the RagPymes testing experience.
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

## Shared Demo Variables

The Access Management guided panel keeps editable shared variables so one API response can feed the next request:

- `tenantId`: captured from register/provision tenant, get tenant, list tenants, invitations, or memberships responses.
- `membershipId`: captured from owner membership, accepted invitation membership, list memberships, or change role responses.
- `invitationId`: captured from create/list/accept/revoke invitation responses.
- `invitationToken`: captured from `CreateTenantInvitationResponse.invitationToken` and reused by accept invitation.

These variables are UI state only; they are not persisted. Users can overwrite them manually before running any guided action. Tenant roles are limited to the roles documented in Postman: `TenantOwner`, `TenantAdmin`, and `TenantMember`.

The guided Access Management panel intentionally does not send authenticated actor fields for self-service tenant registration. Postman states that issuer, subject, actor ID, and role for `RegisterTenant` come from the Bearer token, so the form only sends `companyName`, `slug`, and `contactEmail`.
