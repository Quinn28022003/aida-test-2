# ADR 0007: Supabase Generated Zod Schemas

## Status

Accepted

## Goals

Generated Zod schemas exist so **runtime validation matches the live Postgres schema**, not only the coarse TypeScript view Supabase emits.

| Goal | Detail |
| ---- | ------ |
| **Align validation with the real database** | After migrations are applied, `information_schema.columns` is the source of truth for per-column Postgres types (`uuid`, `timestamptz`, `text`, enums, and so on). |
| **Stricter checks where Postgres is stricter** | Supabase generated types model `uuid`, `timestamptz`, and `timestamp` as `string`. Generated Zod uses `z.uuid()`, `z.iso.datetime({ offset: true })`, and `z.iso.datetime({ local: true })` when the database column is actually `uuid`, `timestamptz`, or `timestamp`, so API and service boundaries reject invalid IDs and timestamps before they reach the DB. |
| **No false positives from naming** | Correlation and external identifiers stored as `text` (for example `request_id`, `trace_id`) stay `z.string()` even when the column name ends with `_id`. |
| **Single regeneration path** | `pnpm db types` keeps TypeScript shapes (`database-generated.types.ts`) and Zod validators (`database-generated.schemas.ts`) in sync with the linked Supabase cloud project. |
| **Reviewable contract** | Committed generated files are diffed in PRs and checked by `pnpm db validate`. |

Migrations remain how we **build** schema history; the database **after** `migrate up` / `db reset` is what we **introspect** for column-level Zod rules.

## Context

AIDA uses Supabase as the database schema source of truth. Supabase CLI already generates `packages/db/src/database-generated.types.ts`, including table `Row`, `Insert`, `Update`, enum unions, and the recursive `Json` type used by `jsonb` columns.

Runtime validation still needs Zod schemas. Hand-written schemas for every generated table shape would drift from Supabase types, especially when migrations add columns, change nullability, add defaults, or update enums. That drift is risky because app code may validate one contract while the database and generated TypeScript types describe another.

`jsonb` columns need special care. PostgreSQL `jsonb` stores real JSON values, not just strings. Valid root values include strings, numbers, booleans, `null`, arrays, and objects. Supabase's generated `Json` type represents optional object properties with TypeScript `undefined`, but runtime JSON does not contain `undefined`.

### Column types and Supabase TypeScript limits

`ts-to-zod` follows Supabase types: every `uuid`, `timestamptz`, and `timestamp` column becomes `z.string()` unless we inject stronger formats. That is weaker than what Postgres accepts and weaker than what we want at API boundaries (for example route params typed from `profilesRowSchema`).

An early approach parsed `supabase/migrations/*.sql` with regex to infer column types offline. That worked for simple `CREATE TABLE` / `ADD COLUMN` flows but could miss complex `ALTER` chains and never saw the database as it actually landed. **We rejected migration parsing as the column-type source** in favour of querying the live schema.

## Decision

- Generate `packages/db/src/database-generated.schemas.ts` from `packages/db/src/database-generated.types.ts`.
- Add `pnpm db schemas` and `pnpm db schemas validate` as the public entry points through the internal DB CLI.
- Keep Supabase CLI generated TypeScript types as the source input for table shapes and enums.
- Use `scripts/generate-db-zod-schemas.mjs` as a repo-owned bridge:
  - parse the generated Supabase type file;
  - build a `table.column` → Postgres type map from **`information_schema.columns`** on the same linked cloud database used for `supabase gen types` (`supabase db query --linked`; SQL in `scripts/lib/column-types-query.sql`, parsing in `scripts/lib/fetch-schema-column-types.mjs`);
  - flatten public table `Row`, `Insert`, and `Update` shapes plus enums into temporary TypeScript;
  - replace `string` with ephemeral `DbUuid`, `DbDateTimeOffset`, and `DbDateTimeLocal` aliases (ts-to-zod `@format uuid` / `@format date-time`) for columns whose live Postgres type is `uuid`, `timestamptz`, or `timestamp` — not by `_id` name heuristics, because some `text` columns end with `_id` (for example `request_id`, `trace_id`);
  - rewrite table property keys to camelCase before `ts-to-zod` (Supabase types remain snake_case);
  - run `ts-to-zod`;
  - normalise the output into the committed generated schema file (canonical `jsonSchema`, inline `z.uuid()`, `z.iso.datetime({ offset: true })`, and `z.iso.datetime({ local: true })` for format aliases).
- Override the generated `jsonSchema` with AIDA's canonical JSON validator so `jsonb` fields accept real JSON values and reject non-JSON runtime values such as `undefined`, `NaN`, and `Infinity`.
- Keep `database-generated.schemas.ts` committed for reviewability and fast imports, but regenerate it rather than editing by hand.

### Sources of truth (by concern)

| Concern | Source of truth | How it is produced |
| ------- | ----------------- | ------------------- |
| Schema history | `supabase/migrations/*.sql` | Hand-written SQL, `pnpm db migrate up` |
| Table / enum **shapes** (TypeScript) | Same database as migrations applied | `supabase gen types` → `database-generated.types.ts` |
| Per-column **Postgres types** for Zod formats | Same database (`public` schema) | `supabase db query` on `information_schema.columns` |
| Runtime **Zod validators** | Generated file | `pnpm db types` / `pnpm db schemas` |

`pnpm db types` and `pnpm db validate` always target the **linked** Supabase cloud project for both `gen types` and the column query so TypeScript shapes and Zod column rules never mix two different databases.

### Why this option

| Option | Outcome |
| ------ | ------- |
| Hand-write Zod schemas | Too much duplication; high drift risk between migrations, Supabase generated types, and runtime validation. |
| Validate only with TypeScript types | TypeScript disappears at runtime and cannot protect API payloads, route inputs, storage reads, or external data. |
| Infer column types from migration SQL (regex) | Offline and fast, but can diverge from the applied schema; rejected as the column-type source. |
| Infer `uuid` from `*_id` column names | Rejected: many `text` columns end with `_id`; only real Postgres types are used. |
| `supabase db dump` for column types | Accurate but requires Docker for local dump; rejected in favour of `supabase db query` (linked uses Management API, no Docker). |
| Generate from `database-generated.types.ts` + **live** `information_schema` | **Chosen.** Reuses the Supabase type contract for shapes, introspects the real DB for column types, keeps output reviewable, and fits the existing grouped DB CLI. |

### Regeneration flow

```text
supabase/migrations  →  apply  →  Postgres (public)
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
         supabase gen types                    supabase db query
         (Row / Insert / Update)              (information_schema.columns)
                    │                                       │
                    └───────────────┬───────────────────────┘
                                    ▼
                    generate-db-zod-schemas.mjs  →  database-generated.schemas.ts
```

## Consequences

- Schema migrations flow through one chain: SQL migration → apply to DB → `pnpm db types` (Supabase types + column introspection → Zod schemas).
- Table, insert, update, enum, and JSONB validators can be imported from `@aida/db` instead of being duplicated in `@aida/contracts` or apps. `@aida/contracts` keeps HTTP-only primitives (envelope, errors, paths).
- Generated Zod schemas are reviewable in PRs and drift-checked with `pnpm db validate` (both generated files).
- The generator becomes part of the database contract toolchain and needs focused tests when generated type shape, enum syntax, JSON handling, or `information_schema` parsing changes.
- `ts-to-zod` remains an implementation dependency of the generator, not the final authority for every schema detail.
- Committing generated schemas adds diff noise after broad database changes, but makes downstream packages simpler and avoids codegen at app startup. Regenerating against a fully migrated database may widen `z.uuid()`, `z.iso.datetime({ offset: true })`, and `z.iso.datetime({ local: true })` coverage compared with older migration-only inference — that is intentional alignment with Postgres.
- `Json` typing and runtime JSON validation intentionally differ around object-property `undefined`: TypeScript may use it for optional properties, while runtime validation rejects it because JSON cannot represent it.
- Supabase TypeScript types still model `uuid`, `timestamptz`, and `timestamp` as `string`; generated Zod schemas are stricter at runtime (`z.uuid()`, `z.iso.datetime({ offset: true })`, `z.iso.datetime({ local: true })`). Inferred TypeScript types from those schemas remain `string`.
- Columns missing from the column-type map keep `ts-to-zod` defaults (usually `z.string()`), which is safer than guessing.
- `pnpm db schemas` queries the linked cloud database (`supabase db query --linked`); it also needs the existing `database-generated.types.ts`.
- `pnpm db types` / `pnpm db validate` run `supabase gen types --linked` then the same column query and Zod generation — require `supabase login` and `supabase link`.
- `pnpm db prepare` runs `pnpm rls sync` and `pnpm db rpc sync` before `pnpm db validate` so generated Supabase types include RLS helper functions and hand-written RPCs installed by those sync steps.

## Usage

After a schema migration on the linked Supabase project:

```sh
pnpm rls sync
pnpm db validate
pnpm --filter @aida/db test
```

Pre-commit and PR drift check (linked project):

```sh
pnpm db validate
```

Use `pnpm db schemas` / `pnpm db schemas validate` only when developing the generator script.
