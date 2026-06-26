# API Testing Notes

This SPA exists to test the RagPymes backend API from a React + Vite frontend.

Use `../rag-pymes-backend/` as the source of truth for API contracts. Before adding or changing frontend API calls, check backend route definitions, DTOs, validation rules, authentication behavior, and available OpenAPI or Postman artifacts.

The current endpoint catalog is loaded from `src/data/postmanCollection.json`, copied from `../rag-pymes-backend/postman/RagPymes.Api - v1.documented.postman_collection.json`. The formal operation contract is read from `api-definition/RagPymes-v1.json`.

## Frontend Structure

The SPA now follows a guided demo structure:

- `src/components/layout/` contains `AppShell`, `Header`, and `MainContent`.
- `src/components/shared/` contains reusable presentation components such as `SectionCard`.
- `src/pages/HomePage.tsx` introduces the API testing purpose and routes users into the demo.
- `src/features/ragPymesApiDemo/` contains the RagPymes testing experience.
- `src/features/ragPymesApiDemo/components/EndpointExplorer.tsx` preserves the full Postman/OpenAPI endpoint explorer as the advanced testing tool.
- `src/styles/globals.css` owns base tokens and global element defaults; component styling should use CSS Modules.

Do not encode guessed backend behavior in the frontend. If an endpoint, payload, or response shape is unclear, inspect the backend first and document the confirmed behavior here.
