# ADR 0002: Authz RLS Generation CLI

## Status

Accepted

## Context

AIDA uses Supabase Row Level Security (RLS) to enforce tenant isolation and user access at the database layer. The permission catalogue, role definitions, table list, and table-to-permission mapping live in `packages/contracts/src/authz`.

Those authz contracts are consumed by application code and by database policy setup. If permission keys, seed data, helper functions, and RLS policies are maintained by hand in separate places, they can drift. Drift here is high risk: a stale SQL policy can grant access that the TypeScript contracts no longer describe, or deny access that the application believes is valid.

The SQL also has ordering and operational constraints:

- permissions, roles, and role-permission rows must be seeded before policies depend on them;
- helper functions must be created before policies call them;
- RLS must be enabled, forced, and granted consistently across all covered tables;
- generated SQL must remain reviewable before it is applied;
- Supabase migrations remain the schema-history mechanism for applying database changes.

## Decision

- Keep `packages/contracts/src/authz` as the source of truth for permission keys, roles, table names, and `TABLE_RLS_POLICY_CONFIG`.
- Use a repo-owned Node CLI under `scripts/rls` to generate deterministic SQL for:
  - permission, role, and role-permission seed data;
  - SECURITY DEFINER helper functions;
  - table RLS enable/force statements;
  - grants and revokes;
  - table policies derived from `TABLE_RLS_POLICY_CONFIG`.
- Provide `node scripts/rls/generate-rls-sql.mjs` for optional preview output in `scripts/rls/generated/aida-rls-sync.sql` (`pnpm rls sync` uses the same generator when applying).
- Provide `pnpm rls sync` to apply the generated SQL through an ephemeral Supabase migration, then repair/delete that migration file so generated RLS sync files are not committed as durable schema history. Each sync resets all policies and RLS flags in the `public` schema before reinstalling generated AIDA RLS (manual public policies are not preserved).
- Make linked Supabase project mode the default `pnpm rls sync` target (`RLS_SYNC_MODE=linked`).
- Reserve `RLS_SYNC_MODE=db-url` for CI and disposable Postgres runs, using `RLS_SYNC_DATABASE_URL` or `DATABASE_URL` as a Postgres connection string.
- Keep `scripts/rls/sync-rls-sql.mjs` independent from app runtime env files; it reads only the shell/GitHub Actions process environment and does not load `apps/api-gateway/.env*`.
- Keep hand-written schema migrations in `supabase/migrations` as the durable source of database structure.
- Keep policy semantics in the generator modules and `docs/auth-rbac.md`, not scattered through application code.

## Consequences

- Authz changes start in one place: update `packages/contracts/src/authz`, then regenerate/sync RLS.
- Application checks, RBAC seed data, and RLS policies share the same permission keys and table policy metadata.
- Generated SQL is deterministic and easy to diff in preview before applying.
- The CLI can fail fast when configured tables do not produce policies, which makes missing RLS coverage visible during development.
- Supabase remains the apply path, so the CLI does not need its own database migration engine.
- Local and deploy syncs depend on the currently linked Supabase project, so operators must verify `supabase link` before running against shared environments.
- CI dry runs must opt into `RLS_SYNC_MODE=db-url`; app URLs such as `https://<project>.supabase.co` are not valid database URLs for this mode.
- The generator becomes security-critical code and needs focused tests, review, and documentation when policy semantics change.
- Ephemeral RLS sync migrations reduce committed generated churn, but operators must remember that a fresh database needs both schema migrations (`pnpm db migrate up`) and `pnpm rls sync`. Stale local `supabase/migrations/*_rls_sync.sql` files must be removed because Supabase CLI applies existing migration files even when git ignores them. Root entry points are documented in [ADR 0006](0006-internal-database-cli.md).
- Product rules that are not expressible in the current contract shape need an explicit contract/generator change rather than ad hoc SQL edits.
