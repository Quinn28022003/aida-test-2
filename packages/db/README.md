# @aida/db

## Purpose

Database types and schema helpers shared across AIDA services.

## Public exports

- `Json` and `Database` (Supabase shape) from `database-generated.types.ts`; `DatabaseGenerated` in the public API is the same type under that alias.
- `Tables`, `TablesInsert`, `TablesUpdate` generic table helpers for row and mutation shapes.
- `Database` from `database.types.ts` is the app-level entry point for overrides later.
- `ProfileRow`, `ProfileInsert`, `ProfileUpdate` readable table aliases kept for compatibility.
- `jsonbSchemas` and related JSONB schema helper types.
- Zod schemas from `database-generated.schemas.ts` (for example `profilesRowSchema`, `invitationStatusEnumSchema`).

## Type usage standard

- Prefer helper-first imports in new code:
  - `type Profile = Tables<"profiles">`
  - `type NewProfile = TablesInsert<"profiles">`
  - `type PatchProfile = TablesUpdate<"profiles">`
- Prefer helper aliases over long direct access like `Database["public"]["Tables"]["profiles"]["Row"]`.
- Use per-table named aliases only when they add clear domain readability in a specific module.

## Migration guidance

- Existing `ProfileRow`, `ProfileInsert`, `ProfileUpdate` exports remain valid and are not breaking.
- New features should default to `Tables<...>`, `TablesInsert<...>`, and `TablesUpdate<...>`.

## Forbidden imports

- Avoid importing app-layer modules. Keep this package pure schema/types.

## Service role bypass discipline

Service role (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS entirely. This is powerful and dangerous — follow these rules:

Authz constants and permission keys come from `@aida/contracts` (granular `resource.action` strings such as `vault_document.read` or `message.create`); backend bypass logic should reuse those keys and match the same access model as RLS helpers.

### Backend-only

- Service role is **backend-only**. Never expose service keys to frontend code, browser extensions, mobile apps, or client-side JavaScript.
- Frontend must use the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and go through RLS policies.

### Narrow and audited

- Service role bypass must be **narrow** — use it only when RLS cannot handle the access pattern.
- All service role queries must be **audited** — log the operation, the reason for bypass, and the affected rows.
- Prefer RLS for user-scoped reads. Do not use service role to fetch data that RLS policies could handle.

### Retrieval jobs

Retrieval jobs using service role must still enforce access controls:

1. **Call access helpers** — use the same `can_access_document()` and `can_access_conversation()` helpers that RLS uses when running with a user context.
2. **Apply equivalent filters** — if not using the helpers directly, apply the same logic: tenant match, active internal membership for org/private scope, parent conversation tenant match plus `can_access_conversation` and direct conversation membership or valid job membership for conversation scope, owner checks for private scope, document status, and chunk `deleted_at`.
3. **Document the bypass** — comment why service role is needed and what filters replace RLS.

Example:

```typescript
// Service role bypass: retrieval runs outside the user's RLS session.
// Keep these predicates equivalent to can_access_document().
const accessibleChunks = await db
  .from('document_chunks')
  .select('*, documents!inner(id, org_id, scope, owner_id, conversation_id, status, deleted_at)')
  .eq('org_id', targetOrgId)
  .eq('documents.org_id', targetOrgId)
  .neq('documents.status', 'deleted')
  .is('documents.deleted_at', null)
  .is('deleted_at', null);

// Then filter candidates by requesterProfileId:
// - org scope: requester is an active internal member of targetOrgId
// - private scope: requester owns the document and is an active internal member
// - conversation scope: requester passes `can_access_conversation` and is a direct conversation member or job member on the document job (matches `can_access_document` for conversation scope; external customers only see job-owned threads they created unless explicitly joined)
```

### When to use service role

| Use case                                        | Approach                             |
| ----------------------------------------------- | ------------------------------------ |
| Background jobs (indexing, cleanup)             | Service role with explicit filters   |
| Admin operations (user deletion, org migration) | Service role with audit logging      |
| User-scoped reads                               | **Use RLS** — do not bypass          |
| Cross-user data aggregation                     | Service role with org-scoped filters |

### When NOT to use service role

- Fetching a user's own data — RLS handles this
- Any frontend-initiated request — use anon key
- Operations that could leak data between tenants — use RLS or explicit tenant filters

## Generated Zod schemas and the live database

`database-generated.schemas.ts` is generated so **runtime validation matches Postgres after migrations are applied**, not only the coarse Supabase TypeScript types (where every `uuid` and `timestamptz` is a `string`).

- **Migrations** (`supabase/migrations/*.sql`) are how we version and apply schema changes.
- **`information_schema.columns`** on the same database used for `supabase gen types` is how we choose `z.uuid()`, `z.iso.datetime({ offset: true })`, `z.iso.datetime({ local: true })`, or `z.string()` per column — via `supabase db query`, not migration regex or `*_id` name guessing.

That keeps API and service boundaries aligned with what the database actually stores. See [ADR 0007](../../docs/adrs/0007-supabase-generated-zod-schemas.md) for goals, rejected options, and the full pipeline.

## Regenerating generated DB files

From the repo root:

```sh
pnpm db types      # supabase gen types --linked + Zod schemas from information_schema
pnpm db validate   # same regeneration, then fails if either file differs from git (pre-commit)
pnpm db schemas    # Zod schemas only; queries information_schema on linked project
```

Zod column types (`z.uuid()`, `z.iso.datetime({ offset: true })`, `z.iso.datetime({ local: true })`) come from **`information_schema.columns`** on the database used for `supabase gen types` (via `supabase db query`).

Use `pnpm db schemas` when working on the Zod generator (`scripts/generate-db-zod-schemas.mjs`).

See [Database schema workflow](../../docs/db-schema.md), [ADR 0006](../../docs/adrs/0006-internal-database-cli.md), and [ADR 0007](../../docs/adrs/0007-supabase-generated-zod-schemas.md).

Generated schema names follow table and enum names, for example `profilesRowSchema`, `profilesInsertSchema`, and `invitationStatusEnumSchema`. Each generated schema also exports a matching inferred type, for example `ProfilesRow`, `ProfilesInsert`, and `InvitationStatusEnum`. Table `z.object` property keys are **camelCase** (for example `authUserId`, `createdAt`) so runtime validators align with API JSON; `database-generated.types.ts` from Supabase stays **snake_case** for query clients. `jsonb` columns use the generated `jsonSchema`, which validates real JSON values rather than string-only payloads. Columns typed as `uuid`, `timestamptz`, or `timestamp` in Postgres validate with `z.uuid()`, `z.iso.datetime({ offset: true })`, or `z.iso.datetime({ local: true })`; plain `text` columns (including correlation ids such as `requestId`) stay `z.string()`. Import validators and inferred schema types from `@aida/db` at use sites — do not duplicate row or enum shapes in `@aida/contracts`. Do not edit either generated file by hand.

## Owner

- TODO: Assign owner.
