# Database schema workflow

Canonical guide for schema changes, migrations, and generated TypeScript types. Database commands are grouped under `pnpm db` and `pnpm rls` in [`tools/cli.ts`](../tools/cli.ts). Supabase CLI is a dev dependency (`pnpm exec supabase` or PATH via `node_modules/.bin`).

**Related:**

- [Backend Architecture](backend-architecture.md) — How data flows from database through repositories and services to the API
- [Monorepo — Database and RLS CLI](monorepo.md#database-and-rls-cli-toolsclits)
- [ADR 0006](adrs/0006-internal-database-cli.md)
- [Operations (runtime DB)](operations.md)

---

## Source of truth

| Rule            | Detail                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Migrations      | Only files under `supabase/migrations/*.sql` define schema history for this repo.                    |
| Dashboard       | Supabase Dashboard is for inspection and debugging. Do not treat dashboard-only DDL as reproducible. |
| Markdown / docs | Never generate migrations from Markdown or prose. Write SQL by hand.                                 |

---

## Prerequisites

- **Node.js** 20+ and **pnpm** (see root `package.json` `engines` / `packageManager`).
- **Supabase CLI** via the repo: after `pnpm install`, use `pnpm exec supabase …` or npm scripts that wrap it.
- **Auth and link (once per clone / machine):**
  ```sh
  pnpm exec supabase login
  pnpm exec supabase link
  ```
  Link associates your CLI session with the project. `supabase/config.toml` contains `project_id` for the intended Supabase project; keep it aligned with the environment you link.

---

## Types pipeline (`@aida/db`)

Design goals and the `information_schema` decision are documented in [ADR 0007: Supabase Generated Zod Schemas](adrs/0007-supabase-generated-zod-schemas.md). In short: **migrations define schema history; the applied database defines per-column Postgres types for runtime Zod validation** (`z.uuid()`, `z.iso.datetime({ offset: true })`, `z.iso.datetime({ local: true })`, and plain `z.string()` where Postgres uses `text`).

| File                                            | Role                                                                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `packages/db/src/database-generated.types.ts`   | **Generated.** Output of `pnpm db types`. Do not hand-edit except via regeneration.                                                |
| `packages/db/src/database-generated.schemas.ts` | **Generated.** Output of `pnpm db types` (via `pnpm db schemas` internally); Zod validators aligned with live Postgres column types. |
| `packages/db/src/database.types.ts`             | Overrides / merging layer if we need to extend the generated shape later.                                                          |
| `packages/db/src/table-types.ts`                | Compatibility aliases (for example `ProfileRow`) for existing consumers.                                                           |
| `packages/db/src/json-schemas.ts`               | JSONB validation helpers where needed.                                                                                             |

Imports in apps should prefer `@aida/db` exports rather than reaching into generated files directly.

### Type usage flow (standard)

1. **Schema changes first** in `supabase/migrations/*.sql`.
2. **Regenerate generated types** with:
   ```sh
   pnpm db types
   ```
3. **Consume table shapes from `@aida/db` helpers** in app code:

   ```ts
   import type { Tables, TablesInsert, TablesUpdate } from '@aida/db';

   type Profile = Tables<'profiles'>;
   type CreateProfileInput = TablesInsert<'profiles'>;
   type UpdateProfileInput = TablesUpdate<'profiles'>;
   ```

4. **Avoid long inline access** like `Database["public"]["Tables"]["profiles"]["Row"]` in feature code.
5. **Use table aliases only when needed** for readability in a specific module; do not add one alias per table by default.

### Runtime validation (Zod)

Use generated schemas from `@aida/db` at API and service boundaries so payloads are checked against the same database the app queries — not only against TypeScript types that collapse `uuid` and `timestamptz` to `string`.

| Input kind | Typical validator |
| ---------- | ----------------- |
| Route / query params referencing a UUID column | Field from a row schema (for example `profilesRowSchema.shape.id`) |
| Request body matching a table insert/update | `*InsertSchema` / `*UpdateSchema` |
| Enum column | `*EnumSchema` |
| `jsonb` column | `jsonSchema` (real JSON values, not arbitrary strings) |

Regenerate after every migration that changes column types: `pnpm db types` (or `pnpm db validate` before commit). The column-type step runs `supabase db query --linked` on `information_schema.columns` against the **same** linked cloud database as `supabase gen types`.

---

## CLI commands (database)

Implemented in `tools/cli.ts`; root `package.json` exposes `pnpm db`, `pnpm rls`, and `pnpm run help`. Design rationale and usage flows: [ADR 0006](adrs/0006-internal-database-cli.md). Summary:

| Command                                            | What it runs                                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm migrate new <name>`                          | `supabase migration new` — creates a new migration file under `supabase/migrations/`.                                                                                                            |
| `pnpm migrate up [--env <env>] [--force]`          | `supabase db push` — apply pending migrations to the **linked** remote database. `--force` adds `--include-all` (team agreement). Production `--force` requires `--confirm production`.          |
| `pnpm migrate up --db-url <url> [--yes] [--debug]` | `supabase db push --db-url` for ephemeral/local Postgres (CI dry-run); does not require `supabase link`.                                                                                         |
| `pnpm migrate down [--env <env>]`                  | `supabase migration down --linked --last 1` — **destructive / careful**. Production requires `--confirm production`.                                                                             |
| `pnpm migrate status [--env <env>]`                | `supabase migration list` — local files vs remote recorded versions. Default `--env development`.                                                                                                |
| `pnpm db types`                                    | Regenerates `database-generated.types.ts` and `database-generated.schemas.ts` from the linked Supabase project (`gen types` + `information_schema` query). See [ADR 0007](adrs/0007-supabase-generated-zod-schemas.md). |
| `pnpm db validate`                                 | Runs `db types` then `git diff --exit-code` on both generated files. Pre-commit gate (linked cloud project).                                                                                     |
| `pnpm db schemas`                                  | Regenerates `database-generated.schemas.ts` only (linked project: types file + `information_schema`).                                                                                            |
| `pnpm db schemas validate`                         | Runs `db schemas` then `git diff --exit-code` on the schema file only.                                                                                                                           |
| `pnpm db prepare`                                  | **Recommended:** full prep on the linked project — `migrate up` → `rls sync` → `rpc sync` → `db validate`. Mutates the linked database. Run `pnpm db migrate status` separately when needed.                  |
| `pnpm db rpc sync`                           | Combine `scripts/rpc/sql/NNN-*.sql` and apply hand-written RPCs via ephemeral migration (run after `pnpm rls sync`). Rationale: [ADR 0010](adrs/0010-hand-written-rpc-ephemeral-sync.md). |
| `pnpm rls sync` / `pnpm rls test`                  | Apply RLS (generates SQL internally) and run integration tests (`rls test` is for CI — not in `db prepare`). See [Monorepo — Database and RLS CLI](monorepo.md#database-and-rls-cli-toolsclits). |

**`--env`:** `development` (default) or `production` sets `NODE_ENV` only. **Supabase CLI targeting is controlled by `supabase link` (and related config), not by `--env`.** Before touching non-dev databases, re-link or use the correct Supabase profile explicitly.

---

## Recommended change flow (cloud dev)

After schema work, you can run the full linked-project pipeline with `pnpm db prepare` (see [Monorepo — Database and RLS CLI](monorepo.md#database-and-rls-cli-toolsclits)). Step-by-step:

1. **Create migration scaffold**
   ```sh
   pnpm db migrate new describe_your_change
   ```
2. **Edit** `supabase/migrations/<timestamp>_describe_your_change.sql` — SQL only, authored manually.
3. **Apply to linked remote**
   ```sh
   pnpm db migrate up
   ```
   Use `pnpm db migrate up --force` only when the team agrees you need `--include-all`.
4. **Inspect history** (optional)
   ```sh
   pnpm db migrate status
   ```
5. **Apply generated RLS**
   ```sh
   pnpm rls sync
   ```
   This installs helper functions and policies that generated Supabase types may expose.
6. **Apply hand-written RPCs**
   ```sh
   pnpm db rpc sync
   ```
   Requires RLS helpers (`current_profile_id()`) and the seeded global owner role.
7. **Check generated DB artifacts** (also runs on pre-commit via linked Supabase)
   ```sh
   pnpm db validate
   ```
   This regenerates `database-generated.types.ts` and `database-generated.schemas.ts`, then fails if either differs from git.
8. **Workspace check**
   ```sh
   pnpm typecheck
   ```
9. **Commit** migration file(s), `packages/db/src/database-generated.types.ts`, and `packages/db/src/database-generated.schemas.ts` together in the same change when possible.

---

## Parity with `old-aida`

The older monorepo used `aida-cli` with a custom `_migration` table and `exec_sql`. **This repo uses Supabase’s migration system** (`db push`, `migration list`, etc.). Commands such as `pnpm db migrate up` map to Supabase CLI; behaviour is **not** the old runner.

`pnpm db migrate down` maps to `supabase migration down` (history / rollback semantics per Supabase docs). It does **not** mirror optional SQL `down/` scripts from the legacy CLI unless you add equivalent process.

### Legacy root script names (removed)

Do not use colon-separated scripts (`pnpm migrate:up`, `pnpm rls:sync`, `pnpm prepare-db`, …) or the removed root `pnpm migrate` entry. Use grouped subcommands instead — full map in [ADR 0006 — Disabled paths](adrs/0006-internal-database-cli.md#10-disabled--unsupported-paths).

---

## Quality gates

- Husky **pre-commit** runs `pnpm lint`, `pnpm typecheck`, `pnpm api check`, and **`pnpm db validate`** (regenerates both generated DB files from the linked project, then diffs); **pre-push** runs `pnpm test` (see [Monorepo guide](monorepo.md#git-hooks-setup)).
- **`pnpm db validate`** needs `supabase login`, `supabase link`, and network access. If link or auth fails, pre-commit fails instead of allowing generated DB files to drift.
- `pnpm db validate` intentionally fails when generated DB files differ from git. After schema or RLS helper changes, commit the regenerated files with the migration/contract change.
- **GitHub Actions CI behaviour:**
  - **Database dry run** (`database-dry-run` job): runs after normal CI and build on PRs and pushes to `develop`, `rewrite`, or `staging`. Applies migrations to an ephemeral Postgres (`pgvector/pgvector:pg16`) with minimal `auth` / `storage` stubs (`supabase/ci/mock_supabase_minimal.sql`), then `pnpm db migrate up --db-url "$DATABASE_URL" --yes --debug`, smoke-generates `public` types, runs `RLS_SYNC_MODE=db-url pnpm rls sync`, then `RPC_SYNC_MODE=db-url pnpm db rpc sync`, then `pnpm rls test`. This job does **not** validate committed generated types — it only tests that migrations, RLS, and bootstrap RPC apply cleanly and types can be generated.
  - **Deploy database** (`deploy-database-staging` / `deploy-database-master` jobs): runs only on push to `staging` or `master`. The `staging` branch uses the `staging` GitHub Environment; the `master` branch uses the `master` GitHub Environment. Each environment must define `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_PROJECT_REF`. The job links that environment's Supabase project, runs `pnpm db migrate up`, then `pnpm rls sync`, then `pnpm db rpc sync` (default linked mode), then `pnpm db migrate status`.
  - **Database type validate** (`database-type-validate-staging` / `database-type-validate-master` jobs): runs only on **push** to `staging` or `master` after the matching deploy job succeeds, so types are regenerated from the updated cloud schema. It compares generated schema types after removing `PostgrestVersion` metadata, which can differ across Supabase runtimes without changing the app schema. This requires the matching GitHub Environment secrets.

---

## Emergency cleanup (cloud dev only)

Use this only when you need to wipe **all data and objects in the `public` schema** and reset migration history so `pnpm db migrate up` can re-apply everything from scratch. It is intentionally destructive and cannot be undone.

**File to run:** [supabase/rollback/remove_all_table_policies_view_udt.example](../supabase/rollback/remove_all_table_policies_view_udt.example)

What it does:

- Drops and recreates the `public` schema (tables, views, types, policies, functions).
- Reapplies standard Supabase grants for `public`.
- Clears `supabase_migrations.schema_migrations` so migrations re-run.

How to run it:

1. Confirm you are in the correct Supabase project (dev only).
2. Open Supabase Dashboard → SQL Editor.
3. Copy the entire contents of the file above and paste it into the editor.
4. Run the SQL, then run `pnpm db migrate up` to re-apply migrations.

Notes:

- Schemas like `auth` and `storage` are not touched.
- You need `service_role` (or equivalent) privileges to clear migration history.

---

## Design reference (canonical)

This section is a **design reference** for review and onboarding. The canonical history is `supabase/migrations/*.sql`. Markdown is too lossy for constraints, indexes, RLS policies, extension setup, data backfills, lock behaviour, and rollout sequencing — never generate master database migrations from this section.

The first concrete cut of this schema lives in [supabase/migrations/20260509064221_aida_mvp_core_schema.sql](../supabase/migrations/20260509064221_aida_mvp_core_schema.sql) (with a local-only down at [supabase/rollback/down/20260509064221_aida_mvp_core_schema_down.sql](../supabase/rollback/down/20260509064221_aida_mvp_core_schema_down.sql)).

This first migration creates the structural baseline schema, indexes, constraints, extensions, and policy-sensitive comments. It does not yet enable table RLS policies or seed platform roles/permissions.

**RLS Enforcement:** Row Level Security permissions, helper functions, and policies are generated from `@aida/contracts` authz constants and applied with `pnpm rls sync` via an ephemeral Supabase migration (`supabase db push`, then file removed from disk). Default sync targets the linked Supabase project (`RLS_SYNC_MODE=linked`); CI `database-dry-run` uses `RLS_SYNC_MODE=db-url` with a Postgres `DATABASE_URL`. `scripts/rls/sync-rls-sql.mjs` does not load app `.env` files. Each sync resets all `public`-schema policies and RLS flags before reinstalling generated coverage — durable policy behaviour must live in contracts and the generator, not hand-written public policies. RLS SQL is not committed in `supabase/migrations/`; reproduce from contracts + generator. If a local ignored `supabase/migrations/*_rls_sync.sql` file is left behind, delete it before `pnpm db migrate up`; Supabase CLI still applies ignored files that exist in the migrations directory. See [Authentication and RBAC](auth-rbac.md) for the full RLS model, helper functions, and document visibility matrix.

### Domain glossary

- `organizations` — tenant root.
- `profiles` — AIDA user profile linked to Supabase Auth.
- `projects` / `jobs` — org-owned project containers and project-scoped customer engagements (not the worker queue).
- `background_jobs` — async worker queue (`background_job_status`, including `dead_letter`).
- `conversations` / `messages` — product chat source of truth.
- `agents` / `agent_versions` — agent identity and immutable runtime config.
- `documents` / `document_chunks` — Vault metadata and RAG material.
- `tools` / `tool_invocations` — executable backend tools and audit trail.
- `integration_connections` / `integration_credentials` / `external_resource_grants` — optional managed external connector state.

### Authoring rules

- Write SQL by hand. Do not promote dashboard changes or generated diffs without review.
- Use `pnpm db migrate new <name>` only to create the timestamped file.
- Prefer idempotent guards where practical, but do not hide unexpected drift with broad `if exists` / `if not exists` everywhere.
- Include explicit indexes, constraints, grants, and comments in schema migrations. RLS policy SQL is generated from `@aida/contracts` and applied with `pnpm rls sync`.
- For data migrations, document batching strategy and expected runtime in the PR.
- Never edit a migration that has shipped to a shared environment; create a corrective migration instead.
- Each migration should be small enough to review and contain one logical change. Schema, RLS, functions/triggers, seed reference data, and data backfills should be separated when that makes rollback or incident review easier.
- Generated TypeScript types come **after** the migration applies to a real database. Never invert that flow (Markdown → generated migration → master database).

### Rollback policy

- Prefer forward fixes for shared databases. Per-migration scripts under `supabase/rollback/down/` are references for carefully reviewed manual recovery, not a repo CLI workflow.
- Master database prefers **forward fixes** over automatic down migrations. Many real migrations include data backfills, enum changes, index builds, RLS changes, or destructive column drops that are not safely reversible.
- Every risky migration needs an explicit rollback note in the PR: what to run, what data may be lost, whether restore-from-backup is required.
- Destructive changes use **expand-and-contract**: add new shape → deploy code that writes both → backfill in batches → switch reads → stop writing old shape → drop old shape in a later migration.
- Master database rollback for a bad data migration uses a tested compensating migration or point-in-time recovery, never a blind down.

### Extensions

```sql
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;
```

`pgvector` is the first-party vector store unless there is a clear scale reason to move embeddings to OpenSearch, Pinecone, or another system. Keeping vectors in Postgres simplifies tenant filtering and auditability.

### Enums

```sql
create type member_type as enum ('internal', 'service');
create type member_status as enum ('invited', 'active', 'suspended', 'removed');
create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type subject_type as enum ('user', 'group', 'role', 'agent', 'conversation');
create type access_level as enum ('viewer', 'participant', 'moderator', 'owner');
-- Later migration narrows conversation access levels to ('viewer', 'editor').
create type sender_type as enum ('user', 'agent', 'router', 'system', 'tool');
create type conversation_status as enum ('open', 'waiting', 'resolved', 'archived');
create type conversation_priority as enum ('low', 'normal', 'high', 'urgent');
create type agent_status as enum ('draft', 'active', 'disabled', 'archived');
create type agent_version_status as enum ('draft', 'active', 'archived');
create type document_scope as enum ('org', 'group', 'agent', 'conversation', 'private');
create type document_status as enum ('upload_pending', 'uploaded', 'extracting', 'chunking', 'embedding', 'indexed', 'failed', 'deleted');
create type vault_resource_status as enum ('active', 'trashed', 'deleted');
create type invocation_status as enum ('queued', 'running', 'completed', 'failed', 'canceled', 'requires_approval');
create type tool_risk_level as enum ('low', 'medium', 'high');
create type task_status as enum ('todo', 'in_progress', 'blocked', 'done', 'canceled');
create type task_checklist_item_status as enum ('todo', 'in_progress', 'blocked', 'done', 'skipped');
create type project_status as enum ('active', 'archived');
create type project_member_role as enum ('owner', 'admin', 'member');
create type customer_job_status as enum ('open', 'closed', 'archived');
create type background_job_status as enum ('queued', 'running', 'completed', 'failed', 'dead_letter', 'canceled');
create type agent_member_access as enum ('viewer', 'invoker', 'manager');
```

### Identity

`profiles` is the AIDA-side user record linked to `auth.users`. A row is provisioned automatically when Auth creates or updates a user (`handle_new_user` / `update_profile_from_user` triggers on `auth.users`; see migration `20260522100000_provision_profile_on_auth_user.sql`). `organizations` is the tenant root. `organization_members` allows the same `profiles` row in multiple orgs through separate rows; `unique (org_id, user_id)` prevents duplicate membership in **one** org. `organizations.data_region` records the residency region or deployment partition; provisioning, storage, Bedrock calls, backups, logs, and background jobs must use matching regional resources when enterprise policy requires residency.

`organization_invitations` issues single-accept tokens. Public lookup may repeat while `status = 'pending'`, `accepted_at is null`, and `expires_at > now()`. `expires_at` is sender-chosen and capped by platform policy. Acceptance must verify token hash, pending status, expiry, and authenticated email match in a single transaction.

### RBAC

- `permissions` is the global permission catalogue keyed by `key`.
- `roles` is org-scoped (NULL `org_id` reserved for system roles).
- `role_permissions` maps roles to permissions.
- `member_roles` grants permissions to individual users through roles.
- `groups`, `group_members`, `group_roles` grant permissions to groups of users through roles.
- `subject_permission_grants` is for narrow user or group exceptions and should be used sparingly because direct grants are harder to audit than role membership.

### Projects & customer jobs

- `projects` is the org-owned container (`key`, `name`, `description`, `status` default `active`, `created_by`).
- `project_members` grants internal users a `project_member_role` (`owner`, `admin`, `member`).
- `jobs` is a **project-scoped customer engagement** (`customer_profile_id`, `external_ref`, `title`, `customer_job_status`, `metadata`). This is **not** the worker queue.
- `job_members` links internal or customer users to a job (`member_kind` `internal` | `customer`, scoped by `project_id`).
- `job_invitations` issues email invites into a job (hashed token; acceptance creates `job_members` with the invited `access_level`).

### Agents

- `agents` and `agent_versions` are scoped to an `org_id`; `project_agents` links agents to projects with project-specific visibility. The FK from `agents.active_version_id` to `agent_versions` is added after both tables exist (forward FK).
- `agent_versions` is immutable runtime config: instructions, model selection, response/memory/RAG/tool policies, version number unique per agent.
- `ensure_default_domain_agent_for_project(project_id)` links a restricted default domain agent to every existing and newly inserted project with an active immutable version.
- `agent_members` is the primary agent access table: `subject_type` limited to `user`, `group`, or `role`; `access` uses `agent_member_access` (`viewer`, `invoker`, `manager`); revoke via `revoked_at`.
- `agent_invitations` issues single-accept email invites granting `agent_member_access` on acceptance.

### Conversations

`conversations` is the chat source of truth, scoped to `org_id`, `project_id`, and `job_id`. `conversation_members` accepts subject types beyond user (e.g. agents joining a conversation) and carries the same project/job scope columns. `conversation_invitations` follows the same single-accept rule as `organization_invitations`.

`messages.sender_type` is one of `user`, `agent`, `router`, `system`, `tool`. `messages.parent_message_id` self-references for threading. `client_message_id` lets clients deduplicate.

`conversation_user_state` keeps per-user-per-conversation read/seen/archive/pin/mute state.

`agent_invocations` carries request/trace correlation plus metadata-only model metrics: provider, model, tokens, latency, finish reason, retry count, model health state, fallback state, error class, prompt template id, and linked retrieval event id. It retains `prompt_log` and `output_log` for MVP debugging, audit, and support review. Both should be redacted or encrypted at write time per org policy. No purge deadline field exists yet — add it once retention workers exist. `reasoning_trace` stores **product-visible** reasoning steps (plan, retrieved sources, tool calls, answer rationale); it must not store raw hidden model chain-of-thought.

`support_handoffs` and `support_handoff_notifications` cover human escalation. Notification rows keep request/trace correlation for delivery debugging. `background_jobs` is the async **worker queue** (`background_job_status`, optional `project_id` / `customer_job_id`); `dead_letter` is terminal — replays must clone the row with a new id. Worker rows preserve request/trace ids when work moves async. Document ingestion jobs must update document failure fields before entering `dead_letter` so the UI shows a stable failed state and retry action without reading worker internals.

### Vault & RAG

- `vault_folders` is the file tree (self-referencing), optionally scoped with `project_id`.
- `knowledge_hubs` are collections of files **or** folders for RAG, optionally scoped with `project_id`. Hubs do not have their own training pipeline; training/indexing remains per file via `documents` and `document_chunks`. Hub status is a derived aggregate (trained / indexing / failed counts, last indexed time).
- `documents` carries Vault metadata, optional `project_id` / `job_id`, ingestion retry/error fields, and trash fields.
- `knowledge_hub_items` references either a `document_id` or `folder_id`, enforced by a check constraint.
- `document_acl` is fine-grained ACL for later work. The baseline model relies on `documents.scope`, `owner_id`, `conversation_id`, org membership, and conversation membership.
- `document_chunks` carries text, token count, embedding (`vector(1024)` — must match the selected Bedrock embedding model), and `deleted_at` for soft delete. The HNSW index `document_chunks_embedding_idx` excludes `embedding is null` and `deleted_at is not null`.
- `document_chunk_sources` records page/section/bounding-box provenance per chunk.
- `message_attachments` links messages to documents.
- `retrieval_events` audits retrieval calls (query, filters, candidates, selected chunks) and carries request/trace correlation plus retrieval latency.

**Vault trash:** Documents use `status = 'deleted'`. Folders and hubs move `'active' → 'trashed' → 'deleted'`. `deleted_at`, `deleted_by`, and `restore_until` drive the Trash UI; `hard_deleted_at` records permanent deletion. Folder trash marks the subtree as trashed; it does not physically cascade-delete child rows during the restore window.

**Embedding cleanup:** Soft-deleted documents are excluded from retrieval by document status. Reindexing marks old chunks `deleted_at` before writing replacement chunks. Hard delete removes chunks via cascade. A cleanup job purges old deleted chunks so pgvector indexes do not retain dead embeddings indefinitely.

**Future versioning** will apply to `vault_folders`, `knowledge_hubs`, `knowledge_hub_items`, `documents`, `document_chunks`, and ACL changes. The model must capture who, what, when, and which trained/indexed artifact was active at the time. Today the schema stores current state only.

### Memory

- `memory_items` is keyed by `(org_id, scope_type, scope_id, key)` where `scope_type` is one of `conversation`, `user`, `agent`, `org`, `router`.
- `conversation_memory` is conversation-scoped durable memory (`conversation_id`, `key`, `value`) separate from generic `memory_items`.
- `conversation_summaries` retains rolling summaries of message ranges per scope.
- `router_preferences` records per-subject intent → agent routing preferences (`ask`, `always_allow`, `never`).

### Tasks

`tasks.progress` is **derived** from checklist completion (completed / total checklist items). The application service or built-in task tool updates it whenever checklist item status changes; direct user-entered percentages are not part of the model. Reminders fire at `due_at - reminder_offset_minutes` (default one hour before). Reminder delivery updates `reminder_sent_at`.

### Forms

Form authoring validation runs for all fields in one call: the overall result writes to `forms.ai_validation_summary`, per-field results write to `form_fields.ai_hint_validation` plus the 1-10 score to `form_fields.ai_hint_quality_score`. The score is an authoring aid only; it must not block publish unless product policy later adds a publish gate.

Chat timeline cards for Forms are compact `messages.content` records (`kind = tool_event`, `toolKey = forms`). The full respondent ↔ guided-agent transcript belongs in `form_session_events`, not in `messages`.

### Tools, plugins, integrations, approvals

- `tools` describes executable backend tools (`built_in`, `internal_api`, `mcp`, `plugin`), optionally scoped with `project_id`. `plugin_id` is set when the tool is provided by a plugin; built-in product tools (e.g. tasks, forms) leave it null and write through their own first-class tables.
- `plugins` / `plugin_installations` / `plugin_ui_panels` cover plugin manifests, per-org installs, and embedded UI panels.
- `plugin_data_records` is AIDA-hosted durable state for SDK-built tools. Plugins do not create core-schema tables. Use this for metadata, settings, lightweight workflow state, cache snapshots, and searchable JSON. Large files still go through object storage.
- `integration_connections` / `integration_credentials` / `external_resource_grants` are required only for AIDA-managed connectors where the platform performs preflight checks and admin configuration. Third-party remote tools may manage provider authorization internally and report failures through `tool_invocations.error`.
- `agent_tools` is the many-to-many between agents and tools, with per-link policy.
- `tool_invocations` is the audit trail for executions. It carries request/trace correlation, latency, retry count, and redacted error class.
- `approvals` covers human-in-the-loop sign-off (e.g. before a high-risk tool runs).

`integration_credentials.encrypted_secret` is AES-256-GCM ciphertext referenced by `encryption_key_id`, with `nonce` stored alongside. Never log the plaintext or expose it to frontend code.

### Audit

`audit_events` is append-only. Every actor (`user`, `agent`, `system`, `service`) writes one row per security-relevant action with the affected resource. Request id and trace id are first-class columns for incident correlation. Indexes support org-scoped recent-first browsing, per-resource lookup, and trace lookup.

### Type generation flow

```
manual SQL migration
  -> local Supabase database
  -> generated TypeScript database types (packages/db/src/database-generated.types.ts)
  -> app, service, and repository code
```

Do not invert the flow. Generated database types describe persisted rows; public API payloads, plugin SDK payloads, and agent runtime events still need explicit runtime schemas because they cross trust boundaries and must validate untrusted input.

If a schema-first TypeScript layer (Drizzle, Prisma, …) is adopted later it should be evaluated as a query/type layer, not automatically as the full source of truth. RLS policies, extensions, vector indexes, triggers, custom functions, and staged data migrations still need SQL migration ownership.

---

## Troubleshooting

### `Remote migration versions not found in local migrations directory`

The remote database records migration versions that have no matching file under `supabase/migrations/`.

1. Run `pnpm db migrate status` to compare local vs remote.
2. **Preferred:** restore the missing file from git history or another branch/machine, using the **exact** version prefix (for example `20250717022241_name.sql`), then `pnpm db migrate up` again.
3. If alignment needs tooling support, use Supabase’s documented flows (for example `supabase db pull`) **with team review** before committing.
4. **`supabase migration repair`** — only if you intend to fix the remote history table and understand the impact. Wrong repair can desynchronise history from actual DDL.

### `pnpm db types` fails (for example `Forbidden`)

Ensure you are logged in (`pnpm exec supabase login`) and that your account can access the linked project. `pnpm db types` uses `supabase gen types typescript --linked`; the linked project must be one you are allowed to read types from.

### Empty or broken `database-generated.types.ts`

`pnpm db types` writes via a temp file then replaces the target so a failed generation does not truncate the committed file. If generation fails, fix auth or link, then rerun `pnpm db types`.
