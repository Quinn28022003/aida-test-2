# RLS SQL generator modules

Code that builds RLS SQL from `@aida/contracts`. The CLI entry point is `../generate-rls-sql.mjs` (preview output and `generateRlsSql()` API). `../sync-rls-sql.mjs` applies via an ephemeral Supabase migration.

| File | Role |
|------|------|
| `sql-primitives.mjs` | Small SQL string builders: policies, functions, RLS enable/force, grants/revokes, header, section joins. |
| `plpgsql-helpers.mjs` | SECURITY DEFINER helper definitions (`current_profile_id`, `can_access_document`, …) and their drop/create statement lists. |
| `table-policies.mjs` | Policy `USING` / `WITH CHECK` expressions from `TABLE_RLS_POLICY_CONFIG`, plus RLS enable/grant setup and public-schema RLS reset before apply. |
| `authz-seed.mjs` | Inserts/updates for `permissions`, `roles`, and `role_permissions` from contract arrays. |

| Output | Purpose |
|--------|---------|
| `scripts/rls/generated/aida-rls-sync.sql` | Preview only (`node scripts/rls/generate-rls-sql.mjs`, gitignored) |
| `supabase/migrations/*_rls_sync.sql` | Ephemeral apply path (`pnpm rls sync`; gitignored, deleted after push) |

Security semantics and ordering are documented in the header comment of `../generate-rls-sql.mjs` and in `docs/auth-rbac.md`.
