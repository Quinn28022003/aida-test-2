# ADR 0004: API Gateway Auth with `@supabase/server`

## Status

Accepted

## Related Documentation

- **Full request flow:** See [Backend Architecture](../backend-architecture.md) for how the Supabase client flows from this middleware through composition, services, and repositories.
- **Dependency injection pattern:** See [docs/architecture.md — Dependency Injection](../architecture.md#dependency-injection-supabase-client-flow).

## Context

Chat and Vault call the API Gateway with `Authorization: Bearer <access_token>`. Users sign in on `apps/identity` with `@supabase/ssr` cookie-backed sessions via `createBrowserClient`; product apps redirect to Identity for auth and use `supabase.auth.getSession()` for session reads. `@aida/api-client` resolves the access token from `getSession()` before each gateway request.

`@supabase/server` 1.0.0 verifies bearer credentials for user auth. The gateway passes the incoming request to `createSupabaseContext()` without parsing Supabase SSR cookies itself.

Two Supabase packages could do this work:

| Package                 | Typical use                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` | Browser and generic server clients — sessions, Auth API, PostgREST, Realtime                   |
| `@supabase/server`      | Server frameworks — request-scoped auth middleware, JWKS verification, typed `supabaseContext` |

Using `@supabase/supabase-js` alone on the gateway would mean either:

- calling `auth.getUser(token)` per request and wiring clients manually, or
- hand-rolling JWT verification (for example HS256 with a legacy shared secret),

without a first-class Hono integration or a single enforced verification path.

Supabase Cloud now issues user access tokens from **JWT Signing Keys** (Settings → **JWT Keys** → **JWT Signing Keys**). The active key should be asymmetric (for example **ECC P-256**). Verification uses the project JWKS at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. The older **Legacy JWT Secret** tab / **Legacy HS256 (Shared Secret)** standby path is not a target for new gateway code.

We previously supported inline `SUPABASE_JWKS` and a legacy HS256 fallback when JWKS returned `{ "keys": [] }`. Both duplicated Supabase’s dashboard workflow and allowed stale keys in app env. We removed them in favour of fetching JWKS from the linked project URL only.

## Decision

- Use **`@supabase/server`** on `apps/api-gateway` only, through `createSupabaseContext()`:
  - `createSupabaseAuthMiddleware()` passes the raw request (including `Authorization`) to `createSupabaseContext(request, { auth: 'user', ...config })`
  - `createSupabaseContext()` verifies the bearer credentials
  - read `supabaseContext` from the Hono context and require `userClaims.id`; return `401` / `auth.unauthenticated` when missing
  - keep verified claims internal to the request context; prefer explicit route params (for example `GET /profiles/:id`) when the client selects a resource id — do not return mapped Supabase user data from API bodies
- Keep **`@supabase/ssr`** on `apps/identity` for browser sign-in and cookie session persistence; keep browser clients on `apps/chat` and `apps/vault` for `getSession()` reads and sign-out; `@aida/api-client` attaches bearer auth via `getAccessToken` wired to `getSession()`
- Build gateway config at startup with `buildSupabaseAuthConfig()`:
  - **always** fetch JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  - **fail fast** if fetch fails, response is invalid, or `{ "keys": [] }`
  - do not accept `SUPABASE_JWKS` or `SUPABASE_JWT_SECRET` in env
- Enforce ESLint: frontend apps must not import `@supabase/server` (use `src/lib/supabase/supabaseClient.ts` with `@supabase/ssr` instead)

### Supabase Cloud: JWT Signing Keys (required for verification)

Operators must configure the linked Supabase project so user JWTs can be verified asymmetrically:

1. Open **Project Settings → JWT Keys → JWT Signing Keys**.
2. Ensure the **CURRENT KEY** is an asymmetric signing key (for example **ECC (P-256)**), not only **Legacy HS256 (Shared Secret)** on standby.
3. New tokens are signed with the current key; the gateway verifies them via JWKS fetched from `SUPABASE_URL` at startup.
4. When rotating, use **Rotate** so the standby key becomes current after validation — do not rely on app-level legacy secret or inline JWKS env vars.

If `/.well-known/jwks.json` returns `{ "keys": [] }`, fix keys in the dashboard — the gateway will not start.

**Env pairing (local / deployed):**

| Chat                                   | API Gateway                |
| -------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `SUPABASE_URL`             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` |

## Consequences

- Gateway auth is one code path: `Authorization` bearer + `createSupabaseContext()` + JWKS from the live project URL, aligned with Supabase’s asymmetric signing keys.
- No `SUPABASE_JWKS` or `SUPABASE_JWT_SECRET` in `@aida/config/server` or gateway `.env.example`; operators configure JWT Signing Keys in the dashboard only.
- Gateway startup requires outbound access to the Supabase Auth JWKS endpoint (or a reachable `SUPABASE_URL` in private networking).
- Frontend/backend split stays clear: `@supabase/ssr` for Chat/Vault session cookies, `@supabase/server` for gateway JWT verification only.
- `@supabase/supabase-js` remains a transitive dependency of `@supabase/server` on the gateway; route code should prefer `supabaseContext` from middleware rather than ad hoc `createClient` auth calls.
- Projects still on legacy-only HS256 signing need a Supabase-side key migration before the gateway can verify users; that is intentional.
- Operational docs: [Operations — API Gateway authentication](../operations.md#api-gateway-authentication-supabase-user-jwt), env reference in [packages/config/README.md](../../packages/config/README.md).

## Alternatives considered

| Alternative                                               | Why not chosen                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` + `auth.getUser(jwt)` per request | No Hono middleware integration; easy to duplicate client setup and skip consistent 401 handling   |
| Manual `jwt.verify` + `SUPABASE_JWT_SECRET`               | Duplicates Supabase legacy mode; secret in app env; diverges from JWKS rotation in the dashboard  |
| Inline `SUPABASE_JWKS` in `.env`                          | Stale keys after dashboard rotation; duplicates the project JWKS endpoint                         |
| Server-side Supabase SSR cookie parsing in the gateway    | Duplicates `@supabase/ssr` session reads; browsers send `Authorization` from `getSession()` instead |
