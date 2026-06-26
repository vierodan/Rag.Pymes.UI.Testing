# Repository Guidelines

## Project Structure & Module Organization

This repository is a React + Vite single-page application for testing the RagPymes backend API at `../rag-pymes-backend/`. Keep the source layout predictable:

- `src/` for application code.
- `src/components/` for reusable UI.
- `src/pages/` or `src/routes/` for views.
- `src/api/` for typed RagPymes API clients, DTO contracts, API configuration, and HTTP error handling.
- `src/lib/` for non-API shared utilities when needed.
- `src/assets/` for images, icons, and local styles.
- `src/__tests__/` or colocated `*.test.ts(x)` files.
- `public/` for files served unchanged by Vite.

Before implementing API-facing changes, inspect `../rag-pymes-backend/` for route definitions, DTOs, validation rules, OpenAPI/Postman artifacts, and authentication behavior. Treat the backend API as the source of truth, but never modify files in that directory from this workspace.

## Build, Test, and Development Commands

Use `package.json` scripts as the source of truth:

- `npm run dev` to start the local Vite development server.
- `npm run build` to produce a production bundle.
- `npm run preview` to serve the built bundle.
- `npm test` to run the Vitest suite.
- `npm run lint` and `npm run format` when ESLint or Prettier are added.

Do not invent new commands without updating `package.json` and this guide.

## Backend API Context

This SPA exists to test the RagPymes API from a React + Vite interface, not to replace backend behavior. Keep requests, payloads, errors, and authentication flows aligned with `../rag-pymes-backend/`. If Codex cannot access that sibling directory, ask the user to relaunch Codex with access:

```bash
codex --cd rag-pymes-frontend-for-testing --add-dir ../rag-pymes-backend
```

Mandatory rule: never create, edit, move, delete, format, or generate files inside `../rag-pymes-backend/` from this frontend workspace. The backend directory is read-only context for this project, even when a task requires consulting backend contracts.

The endpoint catalog is imported from `src/data/postmanCollection.json`, copied from `../rag-pymes-backend/postman/RagPymes.Api - v1.documented.postman_collection.json`. The formal OpenAPI contract is stored in `api-definition/RagPymes-v1.json`. Refresh both when the backend API changes.

## Documentation Rules

All SPA documentation must live under `docs/`. The root `README.md` is the only documentation file allowed outside `docs/`; it must describe that this project is a React + Vite SPA for testing the RagPymes API and link to the other project Markdown files. `AGENTS.md` is reserved for contributor and agent instructions.

There must be exactly one file named `README.md` in the workspace, and it must stay at the repository root. Do not create `docs/README.md`, package-level README files, or duplicate README variants.

## Coding Style & Naming Conventions

Prefer TypeScript. Use 2-space indentation, named exports for shared modules, and PascalCase for components (`TenantSelector.tsx`). Use camelCase for functions, hooks, variables, and non-component files. Prefix custom hooks with `use`, for example `useTenantApi.ts`.

Keep components focused and move cross-cutting logic into `src/lib/` or dedicated hooks.

## Testing Guidelines

Use Vitest and React Testing Library. Name tests `*.test.ts` or `*.test.tsx`, colocated with the unit under test or under `src/__tests__/`. Cover user-visible behavior, API mapping, validation, and error states.

## Commit & Pull Request Guidelines

No Git history is present in this workspace yet. Until a convention is established, use concise Conventional Commits such as `feat: add tenant dashboard` or `fix: handle empty API response`.

Pull requests should include a short summary, linked issue when applicable, test evidence, and screenshots or recordings for UI changes.
