# RagPymes API Testing SPA

This project is a React + Vite single-page application for testing the RagPymes backend API. The backend API lives outside this workspace at `../rag-pymes-backend/` and should be treated as the source of truth for routes, DTOs, validation rules, authentication, and expected responses.

The SPA should make it easy to exercise backend workflows from a browser, inspect request and response behavior, and validate API-facing frontend assumptions while the RagPymes backend evolves.

## Documentation

Project documentation is kept in `docs/`. The only `README.md` file in this workspace must remain this root file.

- [Contributor and agent guidelines](AGENTS.md): repository rules, workspace constraints, and backend read-only policy.
- [API testing notes](docs/api-testing.md): operational usage, manual flows, smoke checklist, artifact refresh steps, and seed-script proposal.
- [SPA demo execution plan](docs/spa-demo-test.md): phased implementation plan and prompts for each phase.

## Development

Available commands:

```bash
npm run dev
npm run build
npm run preview
npm test
```

The endpoint explorer is generated from `src/data/postmanCollection.json`, copied from the backend Postman collection, and enriched with the formal OpenAPI contract in `api-definition/RagPymes-v1.json`.

For operational testing, refresh procedures, and smoke-test scenarios, use [docs/api-testing.md](docs/api-testing.md).

Before implementing API-facing changes, inspect `../rag-pymes-backend/` or relaunch Codex with backend access:

```bash
codex --cd rag-pymes-frontend-for-testing --add-dir ../rag-pymes-backend
```
