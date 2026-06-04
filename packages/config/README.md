# @aida/config

Environment variable parsing and validation using Zod. This package separates public (browser-safe) configuration from backend secrets, and uses **different** validated shapes for API Gateway, Background Service, Vault, and Chat where their `.env` requirements differ.

## Import Paths

### Allowed Imports

| Path                  | Purpose                        | Use In                     |
| --------------------- | ------------------------------ | -------------------------- |
| `@aida/config/public` | Public env vars (browser-safe) | Frontend apps, shared code |
| `@aida/config/server` | API Gateway secrets            | API gateway only           |
| `@aida/config/worker` | Background worker secrets      | Background service only    |

### Forbidden Imports (ESLint Enforced)

| Path                  | Forbidden In              | Reason                      |
| --------------------- | ------------------------- | --------------------------- |
| `@aida/config/server` | `apps/chat`, `apps/vault`, `apps/identity` | Contains secrets            |
| `@aida/config/worker` | `apps/chat`, `apps/vault`, `apps/identity` | Contains secrets            |
| `@aida/config` (root) | Any app                   | Does not export env helpers |

## Usage

### Frontend — Vault (`apps/vault`)

```typescript
import { getVaultPublicEnv } from '@aida/config/public';

const env = getVaultPublicEnv();
// env.NEXT_PUBLIC_SUPABASE_URL
// env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// env.NEXT_PUBLIC_POSTHOG_KEY (optional)
// env.NEXT_PUBLIC_POSTHOG_HOST (optional)
```

### Frontend — Chat (`apps/chat`)

```typescript
import { getChatPublicEnv } from '@aida/config/public';

const env = getChatPublicEnv();
// Same as vault, plus:
// env.NEXT_PUBLIC_VAULT_DOMAIN
// env.NEXT_PUBLIC_IDENTITY_DOMAIN
```

### Frontend — Identity (`apps/identity`)

```typescript
import { getIdentityPublicEnv } from '@aida/config/public';

const env = getIdentityPublicEnv();
// env.NEXT_PUBLIC_CHAT_DOMAIN
// env.NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS
```

`getPublicEnv()` is an alias for `getVaultPublicEnv()`. Prefer the explicit helpers above.

Call these helpers from shared browser code (for example `createBrowserSupabaseClient()` in `apps/chat`, `apps/vault`, or `apps/identity`). Do not read `process.env` directly in client components — use the validated object from `@aida/config/public` instead.

### Backend Server (API Gateway)

```typescript
import { getServerEnv } from '@aida/config/server';

const env = getServerEnv();
// env.PORT — positive integer
// Core: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, AWS_*, LOG_LEVEL, DEBUG, AIDA_DEBUG_TRACE
// Gateway-only: SUPABASE_PUBLISHABLE_KEY, CORS_ALLOWED_ORIGINS, APP_ENCRYPTION_KEY, RESEND_*, BEDROCK_MODEL_*
```

### Backend Worker (Background Service)

```typescript
import { getWorkerEnv } from '@aida/config/worker';

const env = getWorkerEnv();
// env.PORT — positive integer
// Core: same as server (Supabase, DB, AWS, logging)
// Worker-only: BEDROCK_MODEL_SUMMARIZER, BEDROCK_MODEL_EMBEDDING
```

## Environment Variables

### Public — shared (`vaultPublicEnvSchema` / base for both frontends)

| Variable                               | Required | Default | Description            |
| -------------------------------------- | -------- | ------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes      | -       | Supabase project URL   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | -       | Supabase anonymous key |
| `NEXT_PUBLIC_POSTHOG_KEY`              | No       | -       | PostHog API key        |
| `NEXT_PUBLIC_POSTHOG_HOST`             | No       | -       | PostHog host URL       |

### Public — Chat only (`chatPublicEnvSchema`)

| Variable                   | Required | Default | Description                        |
| -------------------------- | -------- | ------- | ---------------------------------- |
| `NEXT_PUBLIC_VAULT_DOMAIN` | Yes      | -       | Origin of the Vault app (e.g. URL) |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes   | -       | API Gateway origin (e.g. `http://localhost:3002`) |
| `NEXT_PUBLIC_IDENTITY_DOMAIN` | Yes | -    | Origin of the Identity app (e.g. `http://localhost:3006`) |

### Public — Vault only (`vaultPublicEnvSchema`)

| Variable                      | Required | Default | Description |
| ----------------------------- | -------- | ------- | ----------- |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes      | -       | API Gateway origin |
| `NEXT_PUBLIC_IDENTITY_DOMAIN` | Yes      | -       | Origin of the Identity app |

### Public — Identity only (`identityPublicEnvSchema`)

| Variable                                | Required | Default | Description |
| --------------------------------------- | -------- | ------- | ----------- |
| `NEXT_PUBLIC_CHAT_DOMAIN`               | Yes      | -       | Default post-auth destination (Chat home) |
| `NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS` | Yes      | -       | Comma-separated origins allowed for `returnTo` redirects |

### Backend — core (included in both `serverEnvSchema` and `workerEnvSchema`)

| Variable                    | Required | Default | Description                         |
| --------------------------- | -------- | ------- | ----------------------------------- |
| `SUPABASE_URL`                | Yes      | -       | Supabase project URL (Auth API)     |
| `SUPABASE_SERVICE_ROLE_KEY`   | Yes      | -       | Service role key for server-side Supabase clients |
| `DATABASE_URL`                | Yes      | -       | PostgreSQL connection string |
| `AWS_REGION`                  | Yes      | -       | AWS region |
| `AWS_ACCESS_KEY_ID`           | Yes      | -       | AWS access key |
| `AWS_SECRET_ACCESS_KEY`       | Yes      | -       | AWS secret key |
| `LOG_LEVEL`                   | No       | `info`  | Log level: debug, info, warn, error |
| `DEBUG`                       | No       | `false` | Debug mode flag |
| `AIDA_DEBUG_TRACE`            | No       | `false` | Debug trace flag |

### Backend — API Gateway only (`serverEnvSchema`)

| Variable                   | Required | Description                              |
| -------------------------- | -------- | ---------------------------------------- |
| `SUPABASE_PUBLISHABLE_KEY` | No       | Publishable key — must match chat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for user JWT routes |
| `PORT`                     | Yes      | Server port (parsed as positive integer) |
| `API_GATEWAY_DOMAIN`       | No       | Public API origin for Swagger — match chat/vault `NEXT_PUBLIC_API_GATEWAY_URL`; defaults to `http://localhost:PORT` |
| `CORS_ALLOWED_ORIGINS`     | Yes      | Comma-separated browser origins (Chat, Vault, etc.) |
| `APP_ENCRYPTION_KEY`       | Yes      | Encryption key for sensitive data        |
| `RESEND_API_KEY`           | Yes      | Resend API key for email                 |
| `SUPPORT_EMAIL_FROM`       | Yes      | Support email sender                     |
| `BEDROCK_MODEL_ROUTER`     | Yes      | Bedrock router model or inference profile |
| `BEDROCK_MODEL_DOMAIN_DEFAULT` | Yes  | Bedrock default domain agent model or inference profile |
| `BEDROCK_MODEL_SUMMARIZER` | Yes      | Bedrock summariser model or profile      |

### Backend — Background Service only (`workerEnvSchema`)

| Variable                   | Required | Description                              |
| -------------------------- | -------- | ---------------------------------------- |
| `PORT`                     | Yes      | Worker port (parsed as positive integer) |
| `BEDROCK_MODEL_SUMMARIZER` | Yes      | Bedrock summariser model or profile      |
| `BEDROCK_MODEL_EMBEDDING`  | Yes      | Bedrock embedding model                  |

### API Gateway user JWT auth

- Verification uses `@supabase/server` `withSupabase({ auth: 'user' })` and asymmetric JWKS only.
- At startup the gateway fetches JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (configure **JWT Signing Keys** in Supabase Cloud).
- **`SUPABASE_JWT_SECRET` and `SUPABASE_JWKS` are not supported** — remove them from `apps/api-gateway/.env` if present.

### Bedrock Model Notes

- `BEDROCK_MODEL_ROUTER` must be set to the Bedrock router model or inference profile (API Gateway).
- `BEDROCK_MODEL_DOMAIN_DEFAULT` must be set to the Bedrock default domain agent model or inference profile (API Gateway).
- `BEDROCK_MODEL_SUMMARIZER` must be set to the Bedrock summariser model or inference profile (API Gateway and Background Service).
- `BEDROCK_MODEL_EMBEDDING` must be set on the Background Service only.

## How environment variables are loaded

Validation always goes through Zod schemas in `src/schemas/env.ts`, but **where** values come from depends on the app type.

### Frontend — Chat and Vault (Next.js)

1. Copy `apps/chat/.env.example` → `apps/chat/.env`, `apps/vault/.env.example` → `apps/vault/.env`, and `apps/identity/.env.example` → `apps/identity/.env`.
2. Local dev runs `dotenv -- next dev` (see each app’s `package.json`), which loads that app’s `.env` into the Node process before Next starts.
3. Next.js reads `NEXT_PUBLIC_*` from the app directory and inlines them into **client** bundles at dev/build time. Only **static** reads like `process.env.NEXT_PUBLIC_SUPABASE_URL` are inlined — not `schema.safeParse(process.env)` on the whole object.
4. `@aida/config/public` therefore uses `getPublicProcessEnvSnapshot()` (`src/utils/public-process-env-snapshot.ts`): each known `NEXT_PUBLIC_*` key is read individually, then parsed with `getVaultPublicEnv()`, `getChatPublicEnv()`, or `getIdentityPublicEnv()`.
5. The first call to either helper validates and caches the result (server render or browser). Missing values throw with the same formatted Zod error as backend apps.

After changing `.env`, **restart** the Next dev server so client bundles are rebuilt with new `NEXT_PUBLIC_*` values.

`PORT` in frontend `.env` files is for the Next server only; it is not part of `vaultPublicEnvSchema` or `chatPublicEnvSchema`.

### Backend — API Gateway and Background Service (Node)

1. Copy the app’s `.env.example` → `.env` in `apps/api-gateway` or `apps/background-service`.
2. Import `dotenv/config` at process entry (before other app code).
3. Call `getServerEnv()` or `getWorkerEnv()` once at startup. These helpers parse the full `process.env` object (no Next.js inlining step).
4. If validation fails, the process should exit before listening for traffic.

See [Startup behaviour](#startup-behaviour) below for entry-point examples.

## Error Messages

Validation errors are formatted to be readable and never expose secret values:

```
Invalid environment variables:

✖ Too small: expected string to have >=1 characters
  → at DATABASE_URL
✖ Invalid option: expected one of "debug"|"info"|"warn"|"error"
  → at LOG_LEVEL
✖ Invalid input: expected number, received NaN
  → at PORT
```

## Caching

Parsed environment variables are cached per helper after the first successful parse:

| Helper | Cache scope | Source on first read |
| ------ | ----------- | -------------------- |
| `getVaultPublicEnv()` | Vault public env | Per-key `NEXT_PUBLIC_*` snapshot |
| `getChatPublicEnv()` | Chat public env | Same snapshot (includes `NEXT_PUBLIC_VAULT_DOMAIN`) |
| `getIdentityPublicEnv()` | Identity public env | Same snapshot |
| `getPublicEnv()` | Same as vault | Same as `getVaultPublicEnv()` |
| `getServerEnv()` | API Gateway | Full `process.env` |
| `getWorkerEnv()` | Background worker | Full `process.env` |

Vault, chat, and identity public caches are independent; `resetPublicEnvCache()` clears all three.

Caches are not reactive to `.env` edits. Restart the Node or Next dev process after changing env files.

In tests, call the reset helpers to force a re-parse:

```typescript
import { resetPublicEnvCache } from '@aida/config/public';
import { resetServerEnvCache } from '@aida/config/server';
import { resetWorkerEnvCache } from '@aida/config/worker';
```

## Schema Extension

For gateway-only or worker-only variables, extend the exported schema for that app:

```typescript
import { serverEnvSchema } from '@aida/config/server';
import { z } from 'zod';

const myGatewaySchema = serverEnvSchema.extend({
  MY_GATEWAY_FLAG: z.string().min(1),
});
```

This package only exports `./public`, `./server`, and `./worker`. Variables required in **both** API Gateway and Background Service belong in `coreBackendEnvSchema` inside `packages/config/src/schemas/env.ts` (then extend `serverEnvSchema` / `workerEnvSchema` there with any per-app fields).

## Startup behaviour

### Backend (API Gateway, Background Service)

Validate before accepting traffic:

```typescript
import 'dotenv/config';
import { getServerEnv } from '@aida/config/server';

// Throws if required env vars are missing
const env = getServerEnv();

// Start server with validated env
serve({ port: env.PORT, ... });
```

### Frontend (Chat, Vault, Identity)

No separate startup hook is required. Ensure `.env` exists and run the app’s dev script (`dotenv -- next dev`). Validation runs when app code first calls `getVaultPublicEnv()`, `getChatPublicEnv()`, or `getIdentityPublicEnv()` — typically inside `createBrowserSupabaseClient()` when a client component mounts or on the server during SSR.

If the browser reports `Invalid environment variables` with `received undefined` on `NEXT_PUBLIC_*` keys despite a filled `.env`, see [How environment variables are loaded](#how-environment-variables-are-loaded) (wrong `.env` location, dev server not restarted, or reading `process.env` outside `@aida/config/public`).
