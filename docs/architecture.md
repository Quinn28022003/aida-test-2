# AIDA Architecture

## Purpose

This document records the baseline architecture for this repository. It defines the workspace shape and package responsibilities. For the current frontend to backend to database flow, see [Backend Architecture](backend-architecture.md).

## System Shape

AIDA is organised as a Turborepo monorepo with two top-level workspace groups:

- `apps/*` contains runnable applications and services.
- `packages/*` contains shared libraries used by apps or other packages.

## Request Flow

The standard request flow is documented in [Backend Architecture](backend-architecture.md):

```text
Frontend app
  -> @aida/api-client
  -> API Gateway secured route group
  -> Supabase auth middleware
  -> Route handler
  -> Composition factory
  -> Domain service
  -> Repository
  -> Supabase database
```

Repositories are the only application layer that should query Supabase tables directly.

### Dependency Injection: Supabase Client Flow

The Supabase client is created by the auth middleware and flows downward:

```
Middleware (bridges Supabase SSR cookie to bearer credentials, creates Supabase client)
    ↓
Route handler (calls getUserSupabaseClient(context))
    ↓
Composition factory (receives Supabase client, instantiates service + repository)
    ↓
Service constructor (stores Supabase client reference for repository calls)
    ↓
Repository methods (receive Supabase client as a parameter, execute queries)
```

This is **manual dependency injection** (no container). The client never becomes a static/global variable; it flows through function parameters, ensuring:

- Each request has its own Supabase instance (per-request isolation)
- RLS policies execute with the correct user context (from the JWT)
- No state leakage between concurrent requests

Detailed layer responsibilities and examples live in [Backend Architecture](backend-architecture.md).

The root workspace owns shared tooling:

- `pnpm-workspace.yaml` defines workspace membership.
- `turbo.json` defines shared task orchestration.
- `tsconfig.base.json` defines shared TypeScript defaults.
- `eslint.config.mjs` defines lint rules and package-boundary checks.
- `.prettierrc.json` defines formatting defaults.
- `.github/workflows/ci.yml` defines CI/CD checks, including database dry-run validation and staging / master migration deployment.
- `tools/cli.ts` and `tools/commands/*` implement the grouped root CLI (`pnpm db`, `pnpm rls`, `pnpm api`, `pnpm test`); see [ADR 0006](adrs/0006-internal-database-cli.md) and [Database schema workflow](db-schema.md).
- `supabase/migrations/` contains canonical SQL schema history.
- `supabase/ci/` contains CI-only database stubs for running migrations against temporary Postgres.
- `supabase/rollback/down/` contains local-only rollback helpers for specific migrations.

## Applications

- `apps/chat` is the chat frontend application.
- `apps/vault` is the vault frontend application.
- `apps/api-gateway` is the backend API gateway shell. Secured routes authenticate Supabase user access tokens from the `Authorization` header via `@supabase/server` and JWKS (see [Operations — API Gateway authentication](operations.md#api-gateway-authentication-supabase-user-jwt) and [ADR 0004](adrs/0004-api-gateway-supabase-server-auth.md)).
- `apps/background-service` is the background worker shell.

## Shared Packages

- `packages/ui` contains shared frontend UI primitives.
- `packages/contracts` contains shared API and domain contracts, including serialisable model provider request, result, and stream event contracts.
- `packages/api-client` contains client-side API access helpers.
- `packages/db` contains database access code.
- `packages/auth` contains authentication helpers.
- `packages/permissions` contains the CASL-based frontend permission foundation for UI affordance checks from merged permission payloads. It validates catalogue keys through `@aida/contracts`, parses keys into CASL action + subject rules, and does not load permissions or enforce server authorisation.
- `packages/storage` contains storage access helpers.
- `packages/conversations` contains conversation-domain helpers.
- `packages/agents` contains backend-only agent runtime helpers, including Bedrock model provider functions for API Gateway and Background Service.
- `packages/rag` contains retrieval-augmented generation helpers.
- `packages/tools` contains tool integration helpers.
- `packages/tasks` contains task-domain helpers.
- `packages/events` contains event types and helpers.
- `packages/observability` contains logging, metrics, and tracing helpers.
- `packages/config` contains shared configuration helpers.

Each shared package exports from `src/index.ts` and documents its purpose, public exports, forbidden imports, and owner placeholder in its package README.

## Dependency Direction

Frontend apps must not import backend-only packages. The current frontend apps are:

- `apps/chat`
- `apps/vault`

Backend-only packages are guarded in ESLint with `no-restricted-imports` for frontend app source files. Package-boundary rules should remain simple and explicit until the repo has enough real dependencies to justify a stronger boundary tool.

`packages/agents` is backend-only because it depends on AWS Bedrock runtime credentials. Browser apps must consume model streams through API Gateway contracts, not by importing the provider package directly.

## Architecture Change Rules

Architecture changes must update this document or an ADR when they alter:

- workspace layout
- package ownership or responsibility
- dependency direction
- public contracts between apps and packages
- runtime boundaries between frontend and backend code
