# AIDA Monorepo

## Purpose

This document explains how the AIDA monorepo is structured and how to run shared workspace tasks.

## Package Manager

The repository uses `pnpm` workspaces. Workspace packages are defined in `pnpm-workspace.yaml`:

- `apps/*`
- `packages/*`

Install dependencies from the repo root:

```sh
pnpm install
```

## Workspace scripts

Run these from the **repository root**. Turborepo (`turbo run …`) orchestrates app and package scripts for `dev`, `build`, `lint`, `typecheck`, `test`, etc.

**Grouped root commands** — entry points `pnpm db`, `pnpm rls`, `pnpm api`, and `pnpm test` run the TypeScript CLI in [`tools/cli.ts`](../tools/cli.ts). Database/RLS commands are not Turbo tasks. See [ADR 0006](adrs/0006-internal-database-cli.md).

### Apps and packages (Turbo)

```sh
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm turbo run test --filter=@aida/chat
pnpm turbo run test --filter=./packages/*
pnpm turbo run test --filter=./apps/*
pnpm test watch
pnpm test coverage
pnpm format
```

### Database and RLS CLI (`tools/cli.ts`)

Rationale and flow diagrams: [ADR 0006 — Internal Database CLI](adrs/0006-internal-database-cli.md).

Entry points: `pnpm db`, `pnpm rls`, and `pnpm run help`. Database commands target the **linked** Supabase project unless noted. **`--env`** sets `NODE_ENV` only; **which Supabase project runs is controlled by `supabase link`**, not by `--env`. Full workflow: **[Database schema workflow](db-schema.md)** · RLS detail: **[Auth and RBAC](auth-rbac.md)**.

**Start here after `supabase login` + `supabase link`:**

```sh
pnpm db prepare
```

| Command | Purpose |
| --- | --- |
| **`pnpm db prepare`** | Full prep: `db migrate up` → `rls sync` → `rpc sync` → `db validate`. Mutates the linked DB. Run `pnpm db migrate status` separately when needed. |

**Migrations** (`pnpm db migrate`; default `--env development`):

| Command | Purpose |
| --- | --- |
| `pnpm db migrate new <name>` | New file under `supabase/migrations/`. |
| `pnpm db migrate status [--env <env>]` | Local vs remote migration versions. |
| `pnpm db migrate up [--env <env>] [--force]` | Apply pending migrations (`db push`) on the **linked** project. `--force` adds `--include-all` (rare; team agreement). |
| `pnpm db migrate up --db-url <url> [--yes] [--debug]` | Apply migrations to ephemeral Postgres (CI dry-run); no `supabase link`. |
| `pnpm db migrate down [--env <env>]` | Roll back last linked migration record — careful. Production requires `--confirm production`. |

**Types and schemas** (`packages/db/src/database-generated.types.ts`, `database-generated.schemas.ts`):

| Command | Purpose |
| --- | --- |
| `pnpm db types` | Regenerate Supabase types and Zod schemas from the linked cloud project ([ADR 0007](adrs/0007-supabase-generated-zod-schemas.md)). |
| `pnpm db validate` | Same regeneration, then fail if either generated file differs from git. |
| `pnpm db schemas` | Regenerate Zod schemas only (`information_schema` on linked project). |

**RLS** (from `@aida/contracts`; see `scripts/rls/`):

| Command | Purpose |
| --- | --- |
| `pnpm rls sync` | Build contracts, generate SQL, apply RLS (ephemeral migration). |
| `pnpm rls test` | RLS integration tests (CI / disposable Postgres — not part of `db prepare`). |

**Hand-written RPCs** (SQL in `scripts/rpc/sql/`; see [ADR 0010](adrs/0010-hand-written-rpc-ephemeral-sync.md)):

| Command | Purpose |
| --- | --- |
| `pnpm db rpc sync` | Combine `scripts/rpc/sql/NNN-*.sql` and apply via ephemeral migration (run after `pnpm rls sync`). |

To preview SQL without applying: `pnpm --filter @aida/contracts build` then `node scripts/rls/generate-rls-sql.mjs` (writes `scripts/rls/generated/aida-rls-sync.sql`, gitignored).

### API OpenAPI and client CLI

Rationale and dual-spec model: [ADR 0005](adrs/0005-api-client-types-codegen.md) · [ADR 0009](adrs/0009-internal-vs-public-openapi.md).

| Command | Purpose |
| --- | --- |
| `pnpm api openapi` | Regenerate `apps/api-gateway/openapi/internal.openapi.json` and `public.openapi.json` from Hono route `AppType`s |
| `pnpm api client` | Regenerate `packages/api-client/src/generated` from **internal** spec only (`openapi-ts.config.mjs`) |
| `pnpm api generate` | Run `openapi` then `client` |
| `pnpm api check` | Run `generate`, then fail if internal spec, public spec, or generated client differ from git |

Run after changing gateway routes, handler types visible to hono-docs, or `publicDocs` flags on API mounts. Pre-commit runs `pnpm api check`.

## Build and check flow

- `pnpm build` — Turbo runs `build` across workspaces.
- `pnpm lint` — ESLint across workspaces.
- `pnpm typecheck` — TypeScript checks across workspaces.
- `pnpm test` — run Vitest in every workspace (see [Running tests](#running-tests)).
- `pnpm test coverage` — Vitest workspace coverage report for CI (no target filter).
- `pnpm format` — Prettier on supported extensions.

## Quality gates

- **Git hooks (Husky):**
  - `pre-commit` → `pnpm lint`, `pnpm typecheck`, `pnpm api check`, and `pnpm db validate` (linked Supabase types + Zod schema drift check).
  - `pre-push` → `pnpm test` (full Turbo-cached test run before code leaves your machine).
- **Schema / types:** after changing migrations, run `pnpm db types` (or `pnpm db validate`) so both generated DB files stay in sync; pre-commit runs `pnpm db validate` and needs `supabase login` / `supabase link` (see [db-schema.md](db-schema.md)).
- **CI:** pull requests run `lint`, `typecheck`, and `test` in parallel; `build` runs after those succeed. **Database targeting:** `database-dry-run` uses ephemeral Postgres only (`--db-url` / `*_SYNC_MODE=db-url`); deploy jobs link the real Supabase project first, then run migrate/RLS/bootstrap in default linked mode (no `--db-url`). The **database dry run** job runs after build on PRs and pushes to `develop`, `rewrite`, and `staging`: `pnpm db migrate up --db-url`, smoke-generates types, `RLS_SYNC_MODE=db-url pnpm rls sync`, `RPC_SYNC_MODE=db-url pnpm db rpc sync` — it does not diff types against the committed Supabase-generated file. Deploy database jobs run `pnpm db migrate up`, `pnpm rls sync`, and `pnpm db rpc sync` after `supabase link`.

Build outputs for packages typically go to `dist/` per package `tsconfig`.

### Git hooks setup

[Husky](https://typicode.github.io/husky/) is the chosen hook tool and is wired through the root `prepare` script. Hooks live in `.husky/` and are committed to the repo.

```sh
pnpm install   # runs `prepare` → `husky` and registers the hooks
```

| Hook         | File                | Runs                                                        |
| ------------ | ------------------- | ----------------------------------------------------------- |
| `pre-commit` | `.husky/pre-commit` | `pnpm lint`, `pnpm typecheck`, `pnpm api check`, and `pnpm db validate` |
| `pre-push`   | `.husky/pre-push`   | `pnpm test`                                                 |

To add or change a hook, edit the file directly, keep it executable (`chmod +x .husky/<hook>`), and commit it.

### Skipping hooks (escape hatch)

Hooks block by design. Skip them only when you have a justified reason (for example, urgent docs-only revert):

```sh
git commit --no-verify -m "…"
git push   --no-verify
HUSKY=0 git commit -m "…"   # disable Husky for one command
```

If CI is the source of truth for a check, do not silently bypass the local hook for the same check — fix the failure or open the PR with the failure visible so reviewers can see it.

## Workspace tests

Turbo runs each workspace’s Vitest script. Root `vitest.workspace.ts` is for root-level watch mode (`pnpm test watch`). Tests use `vitest.config.ts` per workspace and colocate `*.test.ts` / `*.test.tsx` next to source.

### Running tests

From the repo root, `pnpm test` runs Vitest across all apps and packages via Turbo. To run a subset, call Turbo directly with `--filter`:

```sh
pnpm turbo run test --filter=@aida/chat
```

| Command | What runs |
| --- | --- |
| `pnpm test` | All workspaces under `apps/*` and `packages/*` |
| `pnpm turbo run test --filter=@aida/chat` | One workspace by full package name |
| `pnpm turbo run test --filter=./apps/*` | All apps |
| `pnpm turbo run test --filter=./packages/*` | All packages |

Examples:

```sh
pnpm test
pnpm turbo run test --filter=@aida/chat
pnpm turbo run test --filter=@aida/db
pnpm turbo run test --filter=./packages/*
pnpm turbo run test --filter=./apps/*
```

The root `test` command defaults to `turbo run test`; use Turbo filters directly for subsets.

**Upstream tests:** when you filter to an app (for example `chat`), Turbo may still run `test` in workspace dependencies (`dependsOn: ["^test"]` in `turbo.json`). That is expected — an app’s tests can rely on packages having passed their tests first.

**Hooks and CI:** Husky `pre-push` and CI call `pnpm test` with no target (full suite). Use a filtered run locally while iterating on one app or package.

**Not filtered:** `pnpm test coverage` and `pnpm rls test` always use their own scope (Vitest workspace coverage for apps and packages; RLS integration tests only — see [operations.md](operations.md)).

## Environment variables

Each app keeps its own `.env` beside `.env.example` (`apps/chat`, `apps/vault`, `apps/identity`, `apps/api-gateway`, `apps/background-service`). Validation lives in `@aida/config` (`packages/config/src/schemas/env.ts`).

| App | Config import | Typical local ports (`.env.example`) |
| --- | --- | --- |
| `apps/chat` | `@aida/config/public` (`getChatPublicEnv`) | `3000` |
| `apps/vault` | `@aida/config/public` (`getVaultPublicEnv`) | `3001` |
| `apps/api-gateway` | `@aida/config/server` (`getServerEnv`) | `3002` |
| `apps/background-service` | `@aida/config/worker` (`getWorkerEnv`) | `3003` |
| `apps/identity` | `@aida/config/public` (`getIdentityPublicEnv`) | `3006` |

Full variable tables, Supabase key pairing (chat ↔ api-gateway), API Gateway JWT/JWKS auth flow, and troubleshooting: **[Operations guide — Environment variables](operations.md#environment-variables)** (see [API Gateway authentication](operations.md#api-gateway-authentication-supabase-user-jwt)).

## Adding apps or packages

- Apps under `apps/<name>`, packages under `packages/<name>`.
- Add `package.json`, `tsconfig.json`, `src/index.ts`, and standard `build`, `lint`, `typecheck`, `test` scripts.
- Shared packages: add a README (purpose, exports, boundaries, owner).

Match existing layout before inventing new patterns.

## Dependency boundaries

Frontend apps must not import backend-only packages. ESLint `no-restricted-imports` in `eslint.config.mjs` enforces this. Keep dependencies explicit per package when adding imports.
