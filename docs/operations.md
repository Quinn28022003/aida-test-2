# Operations guide

Runtime configuration, environment validation, and how database operations relate to deployed services.

**Database migration workflow (authoring SQL, push, generated types):** [Database schema workflow](db-schema.md)  
**Monorepo commands:** [Monorepo guide](monorepo.md)

Environment variables are validated through `@aida/config` (`getServerEnv`, `getWorkerEnv`, `getVaultPublicEnv`, or `getChatPublicEnv`). Missing or invalid values fail fast with a readable Zod error. **When** validation runs depends on the app — see [How environment variables are loaded](#how-environment-variables-are-loaded).

## Environment variables

### How environment variables are loaded

| App | `.env` location | Load mechanism | When `@aida/config` validates |
| --- | --------------- | -------------- | ----------------------------- |
| `apps/chat` | `apps/chat/.env` | `dotenv -- next dev` / `next build` | First `getChatPublicEnv()` (e.g. Supabase browser client) |
| `apps/vault` | `apps/vault/.env` | Same as chat | First `getVaultPublicEnv()` |
| `apps/identity` | `apps/identity/.env` | Same as chat | First `getIdentityPublicEnv()` |
| `apps/api-gateway` | `apps/api-gateway/.env` | `import 'dotenv/config'` at entry | `getServerEnv()` before HTTP server starts |
| `apps/background-service` | `apps/background-service/.env` | `import 'dotenv/config'` at entry | `getWorkerEnv()` before worker starts |

**Frontend (`NEXT_PUBLIC_*`):** Chat, Vault, and Identity only expose public keys to the browser. Next.js inlines each `NEXT_PUBLIC_*` value into client bundles at dev/build time when the name is referenced statically. `@aida/config/public` reads each known key individually (`getPublicProcessEnvSnapshot` in `packages/config`) — not the whole `process.env` object — so validation works in both server and client code. After editing `apps/chat/.env`, `apps/vault/.env`, or `apps/identity/.env`, restart the Next dev server.

**Backend:** API Gateway and Background Service parse the full `process.env` after `dotenv` loads the app `.env`. Validation should run once at startup; the process should exit if required keys are missing.

Copy from each app’s `.env.example` (root `README.md` lists the main paths). `PORT` on frontend apps is for Next only and is not validated by `@aida/config/public`.

Further detail: [packages/config/README.md](../packages/config/README.md).

### Variable reference

#### Public (browser-safe, `@aida/config/public`)

Shared by `apps/chat`, `apps/vault`, and `apps/identity` (see each app’s `.env.example`):

| Variable                               | Required | Default | Used By              |
| -------------------------------------- | -------- | ------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | -       | Chat, Vault, Identity |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | -       | Chat, Vault, Identity |
| `NEXT_PUBLIC_POSTHOG_KEY`              | No       | -       | Chat, Vault, Identity |
| `NEXT_PUBLIC_POSTHOG_HOST`             | No       | -       | Chat, Vault, Identity |

Chat only:

| Variable                     | Required | Default | Used By |
| ---------------------------- | -------- | ------- | ------- |
| `NEXT_PUBLIC_VAULT_DOMAIN`   | Yes      | -       | Chat    |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes     | -       | Chat    |
| `NEXT_PUBLIC_IDENTITY_DOMAIN` | Yes    | -       | Chat    |

Vault only:

| Variable                      | Required | Default | Used By |
| ----------------------------- | -------- | ------- | ------- |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes      | -       | Vault   |
| `NEXT_PUBLIC_IDENTITY_DOMAIN` | Yes      | -       | Vault   |

Identity only:

| Variable                                  | Required | Default | Used By  |
| ----------------------------------------- | -------- | ------- | -------- |
| `NEXT_PUBLIC_CHAT_DOMAIN`                 | Yes      | -       | Identity |
| `NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS`   | Yes      | -       | Identity |

`NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS` is a comma-separated list of browser origins (for example `http://localhost:3000,http://localhost:3001`). Identity only redirects to a `returnTo` URL when its origin is in this list; otherwise it falls back to `NEXT_PUBLIC_CHAT_DOMAIN + '/'`.

`apps/chat`, `apps/vault`, and `apps/identity` may also set `PORT` for the Next.js server; that value is **not** validated by `@aida/config/public` (it is not a `NEXT_PUBLIC_*` variable). Set `NEXT_PUBLIC_API_GATEWAY_URL` in chat and vault to the same origin and port as `apps/api-gateway` (`PORT` + protocol, e.g. `http://localhost:3002`).

**Shared auth cookies (local and production):** Identity signs users in with `@supabase/ssr`; Chat and Vault keep their own Supabase browser clients and receive the same session cookies when the apps share a registrable domain. On localhost, different ports still share the `localhost` host, so cookies work across `3000`, `3001`, and `3006`. In production, if Identity and product apps use different subdomains, configure Supabase cookie settings for the shared parent domain so `sb-*` cookies are visible to all apps.

#### Backend — shared core (`apps/api-gateway`, `apps/background-service`)

Validated via `coreBackendEnvSchema` (included in both server and worker schemas):

| Variable                      | Required | Default | Used By                         |
| ----------------------------- | -------- | ------- | ------------------------------- |
| `SUPABASE_URL`                | Yes      | -       | API Gateway, Background Service |
| `SUPABASE_SERVICE_ROLE_KEY`   | Yes      | -       | API Gateway, Background Service — service role key |
| `DATABASE_URL`                | Yes      | -       | API Gateway, Background Service |
| `AWS_REGION`                  | Yes      | -       | API Gateway, Background Service |
| `AWS_ACCESS_KEY_ID`           | Yes      | -       | API Gateway, Background Service |
| `AWS_SECRET_ACCESS_KEY`       | Yes      | -       | API Gateway, Background Service |
| `LOG_LEVEL`                   | No       | `info`  | API Gateway, Background Service |
| `DEBUG`                       | No       | `false` | API Gateway, Background Service |
| `AIDA_DEBUG_TRACE`            | No       | `false` | API Gateway, Background Service |

#### Backend — API Gateway only (`@aida/config/server`)

| Variable                   | Required | Default | Description |
| -------------------------- | -------- | ------- | ----------- |
| `SUPABASE_PUBLISHABLE_KEY` | No      | -       | Publishable key — must match chat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for user JWT routes |
| `PORT`                     | Yes      | -       | HTTP port (positive integer) |
| `API_GATEWAY_DOMAIN`       | No       | `http://localhost:<PORT>` | Public API origin for Swagger — set in deploy; match chat/vault `NEXT_PUBLIC_API_GATEWAY_URL` |
| `CORS_ALLOWED_ORIGINS`     | Yes      | -       | Comma-separated browser origins allowed for CORS (e.g. `http://localhost:3000,http://localhost:3001,http://localhost:3006`) |
| `APP_ENCRYPTION_KEY`       | Yes      | -       | Application encryption key |
| `RESEND_API_KEY`           | Yes      | -       | Resend API key for email |
| `SUPPORT_EMAIL_FROM`       | Yes      | -       | Support email sender address |
| `BEDROCK_MODEL_ROUTER`     | Yes      | -       | Bedrock router model or inference profile |
| `BEDROCK_MODEL_DOMAIN_DEFAULT` | Yes  | -       | Bedrock default domain agent model or inference profile |
| `BEDROCK_MODEL_SUMMARIZER` | Yes      | -       | Bedrock summariser model or inference profile |

#### Backend — Background Service only (`@aida/config/worker`)

| Variable                   | Required | Default | Description                                   |
| -------------------------- | -------- | ------- | --------------------------------------------- |
| `PORT`                     | Yes      | -       | HTTP port (positive integer)                  |
| `BEDROCK_MODEL_SUMMARIZER` | Yes      | -       | Bedrock summariser model or inference profile |
| `BEDROCK_MODEL_EMBEDDING`  | Yes      | -       | Bedrock embedding model                       |

### Environment variable caching

`@aida/config` caches the result of the first successful parse per helper (`getVaultPublicEnv`, `getChatPublicEnv`, `getServerEnv`, `getWorkerEnv`). Caches are not reactive to `.env` edits — restart the dev server or backend process after changing env files. Tests can call `resetPublicEnvCache()`, `resetServerEnvCache()`, or `resetWorkerEnvCache()` to force a re-parse (see `packages/config/README.md`).

### API Gateway authentication (Supabase user JWT)

End-to-end flow for secured gateway routes (for example `GET /profiles`):

```mermaid
sequenceDiagram
    participant Product as apps/chat or apps/vault
    participant Identity as apps/identity
    participant Supabase as Supabase Auth
    participant GW as apps/api-gateway

    Product->>Identity: Unauthenticated guard redirects to /login?returnTo=...
    Identity->>Supabase: Sign in (anon key)
    Supabase-->>Identity: Session cookies (shared domain)
    Identity-->>Product: Redirect to allowed returnTo
    Product->>GW: Request with Authorization bearer
    Note over GW: Verify JWT via JWKS
    GW-->>Product: 200 or 401 auth.unauthenticated
```

**Browser (product apps and Identity)**

1. Unauthenticated users on protected Chat/Vault routes are redirected to `apps/identity` (`NEXT_PUBLIC_IDENTITY_DOMAIN`) with a full `returnTo` URL. Legacy product `/login?next=/path` links redirect to Identity with `returnTo` set to the product origin plus the safe local path.
2. Identity signs users in with its Supabase SSR client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). `@supabase/ssr` owns `sb-*` session cookie read/write during sign-in, sign-up, password reset, and sign-out. After success, Identity redirects only when `returnTo`’s origin is listed in `NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS`; otherwise it sends users to `NEXT_PUBLIC_CHAT_DOMAIN + '/'`.
   - **Password policy:** register and reset-password forms validate in `apps/identity/src/lib/auth/schemas.ts` (minimum 8 characters plus uppercase, lowercase, number, and special character). Align the Supabase project **Auth → Password** settings with the same rules so weak passwords cannot be set via the Auth API alone.
3. Chat and Vault keep their existing Supabase browser clients for session reads and sign-out. Product apps do not host auth forms anymore; thin legacy auth routes only forward query params to Identity.
4. `@aida/api-client` sends gateway requests with `Authorization: Bearer <access_token>` from `supabase.auth.getSession()` (wired through `getAccessToken` on the browser API client). The gateway verifies the bearer token with `@supabase/server`. See [packages/api-client/README.md](../packages/api-client/README.md).

**API Gateway startup**

1. `getServerEnv()` validates `apps/api-gateway/.env` (`@aida/config/server`).
2. `buildSupabaseAuthConfig()` (`apps/api-gateway/src/supabase/authConfig.ts`) builds `WithSupabaseConfig` for `auth: 'user'`:
   - **JWKS:** fetch `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` at startup.
   - **Fail fast** if JWKS is missing, invalid, or `{ "keys": [] }` — the gateway does not start without at least one signing key.
   - **Keys:** bridge `SUPABASE_PUBLISHABLE_KEY` / secret key vars into the Supabase env block (publishable key must match chat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
3. `createSupabaseAuthMiddleware()` uses `@supabase/server` `createSupabaseContext()` on secured routes with the request `Authorization` header.

**Per request**

1. Middleware verifies the `Authorization` bearer credentials from the incoming request.
2. Gateway reads `supabaseContext` and requires `userClaims.id`; otherwise responds with `401` / `auth.unauthenticated` (`Authentication required`).
3. Route handlers do not verify JWTs themselves or expose raw claims in responses; `GET /auth/session` returns `{ authenticated: true }` and the frontend uses its Supabase client for display data.

**Supported env (gateway)**

| Variable | Role |
| -------- | ---- |
| `SUPABASE_URL` | Project URL; JWKS fetched from `/auth/v1/.well-known/jwks.json` at startup |
| `SUPABASE_PUBLISHABLE_KEY` | Must match chat anon key for user-scoped Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for server-side Supabase clients — **not** used to verify user JWTs |

**Not supported:** `SUPABASE_JWT_SECRET` (legacy HS256) or `SUPABASE_JWKS` (inline JWKS JSON). Remove them from `.env` if present. Configure **JWT Signing Keys** in Supabase Cloud so the project JWKS endpoint returns signing keys.

**Local pairing checklist**

| Chat (`apps/chat/.env`) | API Gateway (`apps/api-gateway/.env`) |
| ----------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` (same project) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` |
| `NEXT_PUBLIC_API_GATEWAY_URL` | `API_GATEWAY_DOMAIN` or `http://localhost:<PORT>` (default `3002`) |

Troubleshooting 401s: [API Gateway 401 `Invalid credentials`](#api-gateway-401-invalid-credentials-on-authenticated-routes).

Rationale for `@supabase/server` vs `@supabase/supabase-js` and Supabase Cloud JWT Signing Keys: [ADR 0004](adrs/0004-api-gateway-supabase-server-auth.md).

### Public OpenAPI and Swagger (`/docs/public`)

The gateway serves **public** API documentation only — no auth on docs routes (distinct from Bearer JWT on secured API routes).

| URL | Content |
| --- | --- |
| `GET /docs/public` | Swagger UI |
| `GET /docs/public/openapi.json` | `public.openapi.json` (domains with `publicDocs: true` in `@aida/contracts`) |

The **internal** spec (`internal.openapi.json`) powers `@aida/api-client` codegen and is **not** exposed over HTTP. Regenerate both specs and the client with `pnpm api generate`; see [ADR 0009](adrs/0009-internal-vs-public-openapi.md).

Swagger **Servers** URL: set `API_GATEWAY_DOMAIN` on the gateway to the public API origin (same value as chat/vault `NEXT_PUBLIC_API_GATEWAY_URL` in deploy). If unset, the served spec uses `http://localhost:<PORT>`. The committed JSON uses a neutral `servers` placeholder; the deploy origin is applied when the file is served.

### Bedrock model configuration

The platform uses AWS Bedrock for AI model inference. `@aida/agents` exposes backend-only provider functions for API Gateway and Background Service. Example values from local `.env.example` files:

- **Router**: Claude Haiku inference profile (for example `arn:aws:bedrock:ap-southeast-2:182399702812:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0`) — required on API Gateway.
- **Domain default**: Claude Sonnet inference profile (for example `arn:aws:bedrock:ap-southeast-2:182399702812:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0`) — required on API Gateway.
- **Summariser**: Claude Haiku inference profile (for example `arn:aws:bedrock:ap-southeast-2:182399702812:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0`) — required on API Gateway and Background Service.
- **Embeddings**: Amazon Titan Text Embeddings V2 (`amazon.titan-embed-text-v2:0`) — required on Background Service only.

Model provider traces store metadata only: provider, model, latency, token counts when present, finish reason, retry count, model health state, fallback state, and error class. Do not store raw prompts, raw completions, tool output, or document excerpts in analytics or Mastra runtime logs.

### Observability and audit

Pino writes high-volume operational logs to stdout. On Vercel, stdout and stderr are captured in Runtime Logs and can be forwarded through Log Drains. Do not store request logs, middleware timing, stack traces, debug traces, or transient provider failures in Postgres.

Postgres stores durable product and security records only: `audit_events`, `agent_invocations`, `tool_invocations`, `retrieval_events`, `background_jobs.status` / `background_jobs.error`, and `support_handoff_notifications`. These records carry `request_id` and `trace_id` where the event crosses request, model, tool, retrieval, job, handoff, or audit boundaries.

Debug traces require `AIDA_DEBUG_TRACE=true` or an explicit debug option. Trace summaries must use stable ids, counts, durations, statuses, and redacted error classes, not raw prompts, message bodies, document excerpts, signed URLs, credentials, or customer tool outputs.

Valid `LOG_LEVEL` values: `debug`, `info`, `warn`, `error`.

---

- `debug` — Verbose logging for development
- `info` — Standard operational logging (default)
- `warn` — Warnings and errors only
- `error` — Errors only

API Gateway and Background Service validate environment variables before starting the HTTP server. On failure, the process exits with a readable error message listing missing or invalid variables.

Example error output:

```
Invalid environment variables:

✖ Too small: expected string to have >=1 characters
  → at DATABASE_URL
✖ Invalid option: expected one of "debug"|"info"|"warn"|"error"
  → at LOG_LEVEL
✖ Invalid input: expected number, received NaN
  → at PORT
```

---

## Security boundaries

### Frontend applications

Apps `apps/chat`, `apps/vault`, and `apps/identity` must only import `@aida/config/public`. ESLint blocks `@aida/config/server` and `@aida/config/worker`.

### Backend applications

- API Gateway: `@aida/config/server` (`getServerEnv`)
- Background Service: `@aida/config/worker` (`getWorkerEnv`)

Server and worker schemas share a **core** backend shape (Supabase, database URL, AWS credentials, logging flags) but **differ** on Bedrock and other variables: see the variable tables above.

---

## Database operations (runtime vs migrations)

| Concern                        | Where it lives                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema changes**             | Manual SQL in `supabase/migrations/`, applied with Supabase CLI via `pnpm db migrate` (`pnpm db migrate up`, etc.). Full procedure: [db-schema.md](db-schema.md). |
| **Runtime connectivity**       | Apps use `NEXT_PUBLIC_SUPABASE_*` (chat/vault), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL` — validated by `@aida/config`. |
| **Generated DB artifacts** | `pnpm db types` writes `database-generated.types.ts` and `database-generated.schemas.ts`; `pnpm db validate` (pre-commit) regenerates both and diffs against git. Commit regenerated files when schema or RLS helpers change. |

Operational rules:

- **Cloud dev** Supabase is the intended environment for schema iteration; migrations in Git remain the source of truth.
- **Dashboard** SQL is not a substitute for committed migrations.
- **`pnpm db migrate … --env production`** still targets whichever project is **`supabase link`**’d unless you change link/profile. `--env` sets `NODE_ENV` only — coordinate access before running destructive commands (`pnpm db migrate down`) on any shared or master-like project. Production `db migrate down` and `db migrate up --force` require `--confirm production`.

Backend `DATABASE_URL` should point at PostgreSQL compatible with your deployment (often the same Supabase project’s database using the appropriate connection string for pooled or direct sessions). Align values with the Supabase project you use for app traffic.

### RLS testing

Row Level Security policies are generated from scripts in `scripts/rls/` and applied via `pnpm rls sync` (ephemeral Supabase migration + `db push`). Each `pnpm rls sync` run is authoritative for `public`-schema RLS: it drops all existing public policies, disables RLS and `FORCE RLS` on ordinary public tables, then reinstalls generated policies and RLS flags from `@aida/contracts`. Do not rely on hand-written public policies — add behaviour to contracts and the generator instead. Authz keys/roles come from `@aida/contracts` and are reused for seeds, RLS generation, and application checks. Local testing commands:

Ephemeral `supabase/migrations/*_rls_sync.sql` files are gitignored but still visible to Supabase CLI if they remain on disk. Delete stale local RLS sync migrations before `pnpm db migrate up`; durable RLS behaviour belongs in `@aida/contracts` and the generator.

CI runs migrations plus RLS sync, rpc sync, and `pnpm rls test` on **ephemeral** Postgres (`database-dry-run` job). Cloud deploy (`deploy-database-staging` / `deploy-database-master`) runs `pnpm db migrate up`, then `pnpm rls sync`, then `pnpm db rpc sync` on the linked Supabase project.

Hand-written RPC SQL lives in `scripts/rpc/sql/NNN-*.sql` and is applied via `pnpm db rpc sync` (ephemeral `supabase/migrations/*_rpc_sync.sql` → `db push` → repair → delete). See [ADR 0010](adrs/0010-hand-written-rpc-ephemeral-sync.md) for why this uses ephemeral sync instead of durable migrations. Run after `pnpm rls sync` — the RPC depends on `current_profile_id()` and the seeded global owner role. Targeting mirrors RLS: `RPC_SYNC_MODE=linked` (default) or `RPC_SYNC_MODE=db-url` with `RPC_SYNC_DATABASE_URL` or `DATABASE_URL`.

**Legacy migration repair:** if a shared database already recorded durable migration version `20260528173000` (`bootstrap_organization_rpc`), run once before the next normal `pnpm db migrate up`:

```sh
pnpm exec supabase migration repair 20260528173000 --status reverted
```

Fresh ephemeral DBs do not need this step.

**Database targeting (migrate, RLS, bootstrap):** default mode is **linked** — link your project (`pnpm exec supabase link --project-ref <ref>`), then run migrate/RLS/bootstrap commands with no `--db-url` or `*_SYNC_MODE=db-url`. Use **db-url** only for CI `database-dry-run` or local disposable Postgres.

| Mode | When | Migrate | RLS | Bootstrap |
| ---- | ---- | ------- | --- | --------- |
| `linked` (default) | Cloud dev, deploy staging/master | `pnpm db migrate up` after `supabase link` | `pnpm rls sync` | `pnpm db rpc sync` |
| `db-url` | CI `database-dry-run`, local disposable Postgres | `pnpm db migrate up --db-url "$DATABASE_URL"` | `RLS_SYNC_MODE=db-url pnpm rls sync` | `RPC_SYNC_MODE=db-url pnpm db rpc sync` |

For `db-url` sync modes, provide `RLS_SYNC_DATABASE_URL` / `RPC_SYNC_DATABASE_URL` or `DATABASE_URL` as a `postgres://` / `postgresql://` connection string. `--db-url` is passed only to `supabase db push` and `supabase migration repair`, never to `migration new`. `DATABASE_URL=https://<project>.supabase.co` is an app URL, not a valid Supabase CLI database URL. Sync scripts read only `process.env` from the shell or GitHub Actions — they do not load app `.env` files.

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `node scripts/rls/generate-rls-sql.mjs` | Preview deterministic SQL at `scripts/rls/generated/aida-rls-sync.sql` (after building `@aida/contracts`) |
| `pnpm rls sync`     | Generate SQL, reset public RLS, apply via `supabase db push`, then remove ephemeral migration file |
| `pnpm db rpc sync` | Combine `scripts/rpc/sql/NNN-*.sql` and apply via ephemeral migration (after `pnpm rls sync`) |
| `pnpm rls test`     | Run RLS integration tests (see env vars below)                  |

**RLS test connections:** the `postgres` superuser **always bypasses RLS** in PostgreSQL, so `pnpm rls test` must use a non‑superuser harness URL. CI applies `supabase/ci/mock_supabase_minimal.sql` (creates role `rls_ci` / password `rls_ci`) and sets `RLS_TEST_DATABASE_URL` to that user while fixtures still use `DATABASE_URL` as `postgres`. Override `RLS_FIXTURE_DATABASE_URL` only if you need a different superuser URL for fixture load/cleanup.

**Running RLS tests locally:**

```sh
# Ensure migrations are applied to your local database
pnpm db migrate up

# Link cloud dev, then apply RLS (default linked mode)
pnpm exec supabase link --project-ref <ref>
pnpm rls sync

# Ephemeral Postgres (e.g. CI-style DB after db migrate up on plain Postgres)
RLS_SYNC_MODE=db-url DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres pnpm rls sync
RPC_SYNC_MODE=db-url DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres pnpm db rpc sync

# Apply CI stubs if you use plain Postgres (creates rls_ci + auth stub)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/ci/mock_supabase_minimal.sql

# Run RLS tests: harness must not be superuser (rls_ci); fixtures may stay on postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
export RLS_TEST_DATABASE_URL=postgresql://rls_ci:rls_ci@localhost:54322/postgres
pnpm rls test
```

The RLS tests create two test orgs, two internal users, and one external user, then verify:

- Internal users can access org conversations, messages, and Vault documents
- External users can only access their conversation-scoped resources
- Cross-org access is denied
- Document visibility rules are enforced

### CI/CD database validation

- **Raw Postgres dry-run** (`database-dry-run` job): runs after normal CI and build on PRs and pushes to `develop`, `rewrite`, or `staging`. Uses ephemeral Postgres with minimal Supabase stubs (`supabase/ci/mock_supabase_minimal.sql`). Runs `pnpm db migrate up --db-url "$DATABASE_URL" --yes --debug`, smoke-generates types with `supabase gen types --db-url`, then `RLS_SYNC_MODE=db-url pnpm rls sync`, `RPC_SYNC_MODE=db-url pnpm db rpc sync`, and `pnpm rls test`. Does **not** compare against committed generated types (unlike `pnpm db validate`).
- **Deploy database** (`deploy-database-staging` / `deploy-database-master` jobs): runs only on push to `staging` or `master`. Each job links the environment's Supabase project (`supabase link --project-ref`), then `pnpm db migrate up`, `pnpm rls sync`, `pnpm db rpc sync`, and `pnpm db migrate status` (default `NODE_ENV=development`; project targeting is from link, not `--env production`). Requires `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_PROJECT_REF` in the matching GitHub Environment.
- **DB type validate** (`database-type-validate-staging` / `database-type-validate-master` jobs): runs only on **push** to `staging` or `master` after the matching deploy job succeeds. Regenerates types with `supabase gen types --project-id` and diffs against the repo after stripping `PostgrestVersion` (not the same as `pnpm db validate`). Requires the matching GitHub Environment secrets.

---

## Health checks

The API Gateway exposes a health endpoint suitable for load balancers and monitoring.

---

## Troubleshooting

### API Gateway 401 `Invalid credentials` on authenticated routes

Symptom: Chat sends authenticated requests with `credentials: 'include'` but `GET /profiles` (or other secured routes) returns `auth.unauthenticated` with message `Invalid credentials`.

Common causes:

1. **Empty JWKS** — Supabase `/.well-known/jwks.json` returns `{ "keys": [] }`. Configure **JWT Signing Keys** in the project (Settings → JWT Keys). **`SUPABASE_JWT_SECRET` and `SUPABASE_JWKS` are not used** — remove them if still in `.env`.
2. **Project mismatch** — `SUPABASE_URL` in api-gateway must match `NEXT_PUBLIC_SUPABASE_URL` in chat; `SUPABASE_PUBLISHABLE_KEY` must match `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sign out and sign in again after changing env.
3. **Stale session** — Clear browser storage for the chat origin or sign out after rotating Supabase keys.

On startup, api-gateway logs `Loaded Supabase JWKS from project URL` after fetching JWKS from `SUPABASE_URL`.

### Missing environment variables

1. Ensure `.env` exists in the **app** directory (`apps/chat/.env`, `apps/vault/.env`, etc.) — not only at the monorepo root.
2. Copy from that app’s `.env.example`; required keys must be non-empty.
3. Names are case-sensitive; public frontend keys must use the `NEXT_PUBLIC_` prefix.
4. Restart the process after editing `.env` (Next dev server for Chat/Vault; Node process for API Gateway / Background Service).

### `NEXT_PUBLIC_*` undefined in the browser (Chat / Vault)

Symptom: browser console shows `Invalid environment variables` with `received undefined` on `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_VAULT_DOMAIN`, or `NEXT_PUBLIC_API_GATEWAY_URL`, even though `.env` looks correct.

Common causes:

1. **Wrong file path** — values must be in `apps/chat/.env` or `apps/vault/.env`, not another directory.
2. **Dev server not restarted** — Next only picks up `NEXT_PUBLIC_*` changes when the dev server (or build) restarts.
3. **Bypassing app scripts** — run Chat/Vault via `pnpm dev` (turbo) or `pnpm --filter @aida/chat dev` so `dotenv -- next dev` loads the app `.env`; do not run `next dev` from the repo root without loading that app’s env file.
4. **Direct `process.env` in client code** — use `getChatPublicEnv()` / `getVaultPublicEnv()` (or pass explicit options into helpers like `createBrowserSupabaseClient`) so reads stay compatible with Next inlining.

See [How environment variables are loaded](#how-environment-variables-are-loaded).

### Port conflicts

1. Check nothing else is bound to the configured port.
2. For API Gateway and Background Service, `PORT` must be a positive integer (validated by `@aida/config`).
3. Avoid two AIDA services using the same port.
4. After changing `apps/api-gateway` `PORT`, update `NEXT_PUBLIC_API_GATEWAY_URL` in `apps/chat/.env` and restart both processes.

### AWS Bedrock errors

If Bedrock model calls fail:

1. Verify AWS credentials are valid
2. Check the model ID is available in your AWS region
3. Ensure your AWS account has access to the requested models
