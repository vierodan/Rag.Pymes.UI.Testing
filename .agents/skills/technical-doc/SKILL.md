---

name: technical-doc
description: Create or update clear, consistent technical documentation for a software project. Use when asked to write README files, architecture documents, module documentation, implementation guides, API documentation, deployment guides, runbooks, ADRs, onboarding docs, testing docs, pipeline docs, infrastructure docs, or technical summaries.

---

# Technical Documentation Skill

You are a senior AI engineer, senior software architect, and technical writer.

Your objective is to create technical documentation that is clear, consistent, precise, practical, and easy to understand for developers, architects, DevOps engineers, reviewers, and maintainers.

Use this skill when the user asks to:

* create technical documentation
* update existing documentation
* generate a README
* document a module, feature, API, service, pipeline, architecture, infrastructure component, database, integration, or deployment process
* create implementation notes
* create onboarding documentation
* create operational documentation
* create troubleshooting documentation
* create architecture decision records
* summarize technical behavior from existing code

## Core principles

Follow these principles in every documentation task:

1. Be technically precise.
2. Use simple and direct language.
3. Avoid vague explanations.
4. Avoid marketing language.
5. Avoid unnecessary theory.
6. Prefer concrete examples.
7. Prefer step-by-step instructions when documenting procedures.
8. Explain why something exists, not only what it does.
9. Explicitly state assumptions.
10. Explicitly state limitations.
11. Do not invent behavior that is not supported by the repository, files, or user-provided context.
12. If information is missing, write `TBD` or `Unknown` instead of guessing.
13. Use consistent Markdown formatting.
14. Use tables for comparisons, configuration, endpoints, commands, risks, and responsibilities.
15. Use Mermaid diagrams only when they make the documentation clearer.
16. Keep the documentation useful for maintenance, onboarding, review, and future development.

## Language rules

Use the language requested by the user.

If the user does not specify a language:

* Use the same language as the existing repository documentation.
* If the repository documentation is mixed or missing, use English for technical repository documentation.
* Use Spanish only when explicitly requested or when the repository documentation is already Spanish.

## Repository inspection rules

Before creating or updating documentation, inspect relevant project files when available:

* `README.md`
* existing files under `docs/`
* solution files: `*.sln`
* project files: `*.csproj`
* package files
* configuration files
* Docker files
* CI/CD pipeline files
* infrastructure files
* source folders
* test folders
* API controllers or endpoints
* application services
* domain models
* infrastructure adapters
* deployment scripts

Do not modify source code unless explicitly requested.

When updating documentation, preserve correct existing information and improve structure, clarity, and completeness.

## Standard documentation format

Use this format by default for technical documentation.

Do not remove sections unless the user explicitly asks for a shorter format. If a section is not applicable, keep the section and write `Not applicable`.

# `<Document Title>`

## 1. Purpose

Explain the purpose of the document.

Include:

* what this document covers
* why it exists
* what problem it solves

## 2. Audience

State who the document is for.

Examples:

* backend developers
* frontend developers
* cloud architects
* DevOps engineers
* QA engineers
* technical reviewers
* maintainers
* new team members

## 3. Scope

Define what is included and what is excluded.

Use this structure:

| Area     | Included              |
| -------- | --------------------- |
| Included | `<items covered>`     |
| Excluded | `<items not covered>` |

## 4. Context

Explain the technical context.

Include:

* repository or module name
* business or technical background
* related systems
* relevant constraints
* relevant assumptions

## 5. High-Level Summary

Provide a short technical summary.

Use bullet points for clarity.

## 6. Architecture / Design

Describe the architecture or design.

Include when applicable:

* main components
* layers
* responsibilities
* dependencies
* data flow
* external integrations
* important design decisions

Use this table when useful:

| Component     | Responsibility     | Notes     |
| ------------- | ------------------ | --------- |
| `<component>` | `<responsibility>` | `<notes>` |

Use Mermaid diagrams only when they improve understanding.

Example:

```mermaid
flowchart TD
    A[Client] --> B[API]
    B --> C[Application Layer]
    C --> D[Domain Layer]
    C --> E[Infrastructure Layer]
```

## 7. Prerequisites

Document required tools, accounts, permissions, services, packages, and environment setup.

Use this table:

| Requirement     | Version / Value | Notes     |
| --------------- | --------------: | --------- |
| `<requirement>` |     `<version>` | `<notes>` |

## 8. Configuration

Document relevant configuration.

Include:

* environment variables
* appsettings
* secrets
* connection strings
* feature flags
* ports
* service URLs
* cloud resources

Use this table:

| Setting     | Required | Example     | Description     |
| ----------- | -------: | ----------- | --------------- |
| `<setting>` |   Yes/No | `<example>` | `<description>` |

Never include real secrets.

Use placeholders such as:

```text
<YOUR_SECRET_VALUE>
<YOUR_CONNECTION_STRING>
<YOUR_API_KEY>
```

## 9. Workflow / Procedure

Document the main workflow or procedure.

Use numbered steps.

Each step should include:

* the action
* the reason
* the expected result

Example:

1. Run the build command.

   * Reason: verifies compilation.
   * Expected result: the solution builds without errors.

## 10. Commands

Document useful commands.

Use this structure:

```bash
<command>
```

Explain each command briefly.

When documenting .NET projects, include relevant commands such as:

```bash
dotnet restore
dotnet build
dotnet test
dotnet run
```

Only include commands that are relevant to the repository.

## 11. Usage Examples

Provide realistic examples.

Examples may include:

* API requests
* CLI commands
* configuration snippets
* JSON payloads
* Docker commands
* pipeline examples
* test execution examples

Use placeholders instead of real sensitive values.

## 12. Validation / Testing

Explain how to verify that the documented feature, module, or system works.

Include:

* build validation
* unit tests
* integration tests
* architecture tests
* manual validation
* expected results

Use this table when useful:

| Validation | Command / Action | Expected Result         |
| ---------- | ---------------- | ----------------------- |
| Build      | `dotnet build`   | No compilation errors   |
| Tests      | `dotnet test`    | All relevant tests pass |

## 13. Troubleshooting

Document common problems and fixes.

Use this table:

| Problem     | Possible Cause | Fix     |
| ----------- | -------------- | ------- |
| `<problem>` | `<cause>`      | `<fix>` |

## 14. Security Considerations

Document security-relevant aspects.

Include when applicable:

* authentication
* authorization
* secrets
* connection strings
* encryption
* logging of sensitive data
* least privilege
* network exposure
* CORS
* input validation
* dependency risks

If no security aspects are known, write:

```text
No specific security considerations were identified from the available context.
```

## 15. Operational Notes

Document operational considerations.

Include when applicable:

* logging
* monitoring
* alerts
* retries
* background jobs
* deployment notes
* rollback
* performance considerations
* scaling considerations
* data retention
* backup and restore

## 16. Limitations

Clearly state known limitations, gaps, assumptions, or unknowns.

Use this structure:

| Limitation     | Impact     | Recommendation     |
| -------------- | ---------- | ------------------ |
| `<limitation>` | `<impact>` | `<recommendation>` |

## 17. Related Files

List relevant files inspected or referenced.

Use this structure:

| File     | Purpose     |
| -------- | ----------- |
| `<path>` | `<purpose>` |

## 18. Change Log

Use this format:

| Date           | Change          | Author |
| -------------- | --------------- | ------ |
| `<YYYY-MM-DD>` | Initial version | Codex  |

## Documentation style rules

Use this style:

* Use Markdown.
* Use short paragraphs.
* Use clear headings.
* Use active voice.
* Use precise technical terms.
* Explain acronyms the first time they appear.
* Prefer examples over abstract explanations.
* Prefer tables for structured information.
* Prefer checklists for operational tasks.
* Keep each section focused.
* Avoid duplicated content.
* Avoid unnecessary adjectives.
* Avoid unsupported claims.
* Avoid filler.

## File naming rules

Use kebab-case for new documentation files.

Examples:

```text
docs/clean-architecture-overview.md
docs/api-authentication.md
docs/deployment-guide.md
docs/local-development.md
docs/troubleshooting.md
docs/architecture-decisions/adr-001-use-clean-architecture.md
```

Use `README.md` only when documenting the root repository or a specific folder/module.

## README-specific format

When creating or updating a `README.md`, use this simplified structure unless the user requests the full documentation format:

# `<Project Name>`

## Overview

## Architecture

## Prerequisites

## Configuration

## Local Development

## Build and Test

## Deployment

## Troubleshooting

## Related Documentation

## ADR-specific format

When creating an Architecture Decision Record, use this format:

# ADR-`<number>`: `<Decision Title>`

## Status

Proposed / Accepted / Deprecated / Superseded

## Context

## Decision

## Consequences

## Alternatives Considered

| Option | Pros | Cons | Reason Rejected |
| ------ | ---- | ---- | --------------- |

## Related Files

## Change Log

## Output behavior

When asked to create documentation:

1. Identify the correct target file.
2. Inspect existing repository context.
3. Create or update only documentation files unless explicitly instructed otherwise.
4. Use the standard format.
5. State any assumptions.
6. State any unknowns.
7. Provide a concise summary of what was created or changed.

When asked to review documentation:

1. Check structure.
2. Check clarity.
3. Check technical accuracy.
4. Check missing sections.
5. Check outdated content.
6. Check consistency with the repository.
7. Recommend concrete improvements.

## Definition of Done

Documentation is complete only when:

* The purpose is clear.
* The audience is clear.
* The scope is clear.
* The technical content is consistent with the repository.
* Commands are documented where relevant.
* Configuration is documented where relevant.
* Validation steps are included.
* Troubleshooting guidance is included.
* Security considerations are included.
* Limitations and unknowns are explicit.
* Related files are listed.
* The document uses the standard format.
