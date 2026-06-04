# Architecture Index

Use this index to find the current architecture documents.

## Start Here

- [Backend Architecture](backend-architecture.md) — current frontend to backend to database flow.
- [System Architecture](architecture.md) — workspace shape, app and package responsibilities, dependency direction.
- [Database Schema Workflow](db-schema.md) — migrations, generated types, generated Zod schemas.
- [Operations](operations.md) — runtime env, Supabase auth, deployment and operational notes.
- [Auth and RBAC](auth-rbac.md) — permission and RLS model.
- [Monorepo](monorepo.md) — workspace commands and local development workflow.

## Current Backend Flow

```text
Browser app
  -> @aida/api-client
  -> API Gateway secured route group
  -> Supabase auth middleware adds supabaseContext
  -> route handler reads the user Supabase client
  -> composition builds service + repository
  -> service runs the use case
  -> repository queries Supabase
  -> database enforces RLS
```

The request-scoped Supabase client is created by middleware and then passed down explicitly. Do not create ad hoc Supabase clients inside routes or services for normal domain work.

## ADRs

- [ADR 0001: Bedrock Provider Contracts](adrs/0001-bedrock-provider-contracts.md)
- [ADR 0002: Authz RLS Generation CLI](adrs/0002-authz-rls-generation-cli.md)
- [ADR 0003: CASL Permission Foundation](adrs/0003-casl-permission-foundation.md)
- [ADR 0003: Observability and Audit Contracts](adrs/0003-observability-and-audit-contracts.md)
- [ADR 0004: API Gateway Auth with Supabase Server](adrs/0004-api-gateway-supabase-server-auth.md)
- [ADR 0005: API Client Types via Root Codegen Script](adrs/0005-api-client-types-codegen.md)
- [ADR 0006: Internal Database CLI](adrs/0006-internal-database-cli.md)
- [ADR 0007: Supabase Generated Zod Schemas](adrs/0007-supabase-generated-zod-schemas.md) — generated Zod aligned with live Postgres via `information_schema`
- [ADR 0008: Shared Identity App](adrs/0008-shared-identity-app.md)
- [ADR 0009: Internal vs Public OpenAPI](adrs/0009-internal-vs-public-openapi.md)
- [ADR 0010: Hand-written RPC Ephemeral Sync](adrs/0010-hand-written-rpc-ephemeral-sync.md) — numbered SQL files under scripts/rpc/sql/, combined ephemeral apply

## Code Map

| Concern | Location |
| --- | --- |
| Frontend API services | `apps/chat/src/services/`, `apps/vault/src/services/` |
| API client | `packages/api-client/src/` |
| OpenAPI specs (internal + public) | `apps/api-gateway/openapi/*.openapi.json` |
| OpenAPI generators | `apps/api-gateway/hono-docs.ts`, `hono-docs.internal.ts`, `hono-docs.public.ts` |
| API routes | `apps/api-gateway/src/routes/` |
| Public Swagger | `apps/api-gateway/src/routes/docs.ts` (`/docs/public`) |
| Supabase middleware and context | `apps/api-gateway/src/middleware/supabaseAuth.ts`, `apps/api-gateway/src/supabase/` |
| Composition factories | `apps/api-gateway/src/composition/` |
| Domain services | `packages/<domain>/src/services.ts` |
| Domain repositories | `packages/<domain>/src/repositories.ts` |
| Database types and validators | `packages/db/src/` |
| Migrations | `supabase/migrations/` |
