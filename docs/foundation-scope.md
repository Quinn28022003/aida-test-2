# AIDA foundation scope

## Purpose

This document records the original foundation scope for this repository setup. It keeps the initial work focused on workspace structure, shared tooling, and baseline package shells. Later tickets may add schema or CI/CD behaviour; those changes are documented in the linked operational docs rather than expanding the foundation scope retroactively.

## In Scope

The foundation includes:

- Turborepo workspace setup
- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- shared TypeScript config
- ESLint config
- Prettier config
- app directories for chat, vault, API gateway, and background service
- shared package directories listed in the architecture docs
- `src/index.ts` entrypoints for shared packages
- package READMEs with purpose, public exports, forbidden imports, and owner placeholder
- root `AGENTS.md` contributor and AI-agent instructions
- root scripts for dev, build, lint, typecheck, test, and format
- a simple dependency direction guard for frontend apps
- baseline Vitest setup for apps and packages, including `vitest.config.ts` and colocated test files (e.g., `src/index.test.ts`)

## Out of Scope

The foundation does not include:

- product UI
- Supabase schema and root database CLI (see [Database schema workflow](db-schema.md) and [ADR 0006](adrs/0006-internal-database-cli.md))
- runtime business logic
- real API handlers
- authentication flows
- permissions logic
- storage integrations
- observability providers
- deployment configuration (CI/CD database behaviour now lives in [Operations guide](operations.md))

Do not add product behaviour unless it is introduced by a later ticket or documented decision.

## Acceptance Checks

The baseline repo should satisfy:

- `pnpm install` succeeds.
- `pnpm build` runs all empty apps and packages without error.
- `pnpm lint` runs without error.
- `pnpm typecheck` runs without error.
- frontend apps do not import backend-only packages.
- every shared package has `src/index.ts`.
- every workspace has a Vitest config and smoke test.
- root `AGENTS.md` includes the required contributor rules.

## Change Control

If a later task changes architecture, package responsibilities, dependency direction, or this foundation scope, update the relevant docs or add an ADR in the same change.
