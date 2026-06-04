# ADR 0005: API Client via OpenAPI Codegen

## Status

Accepted

## Related Documentation

- **Internal vs public OpenAPI:** See [ADR 0009](0009-internal-vs-public-openapi.md) for why there are two spec files and why SDK codegen reads **internal only**.
- **Full request flow:** See [Backend Architecture](../backend-architecture.md) for how the backend is structured and how the API types are used by frontends.
- **Dependency direction:** See [docs/architecture.md — Dependency Direction](../architecture.md#dependency-direction).

## Context

Frontend apps (Chat, Vault) call `apps/api-gateway` over HTTP using `@aida/api-client`. Typed routes and request/response shapes must stay aligned with the gateway’s real Hono handlers without pulling gateway server code into browser bundles.

The obvious approach is a **workspace dependency**:

```text
@aida/api-client  →  depends on  →  apps/api-gateway (or its types entry)
```

That violates how AIDA is meant to deploy and how dependencies should flow:

| Rule                                            | Why it matters                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Apps deploy separately**                      | `apps/chat`, `apps/vault`, and `apps/api-gateway` are independent deployables (different hosts, env, scale). A shared package must not pull in another app’s server tree at install or bundle time.                                                           |
| **Packages must not import apps**               | Shared code lives under `packages/*`. **Backend apps compose packages** (`createApp`, middleware, `@aida/contracts`, `@aida/db`) — not the reverse. A package that imports `apps/api-gateway` makes the client library depend on a runnable service boundary. |
| **Frontend consumes packages, not the gateway** | Chat may only import browser-safe packages (`@aida/api-client`, `@aida/config/public`, `@aida/contracts` types). Runtime gateway code (`@aida/config/server`, `@supabase/server`, route wiring) must stay on the gateway host.                                |

We still need **one source of truth** for route shapes: the gateway’s Hono route factories. Hand-maintained client types would drift from handlers immediately.

## Decision

Use an **OpenAPI-first codegen pipeline** at the repo root:

```text
Hono route modules (per-domain AppType)
  → @rcmade/hono-docs
  → apps/api-gateway/openapi/internal.openapi.json
  → @hey-api/openapi-ts (+ @hey-api/client-fetch)   # input: internal.openapi.json only
  → packages/api-client/src/generated
```

- **`@aida/api-client` must not list `apps/api-gateway` as a dependency** and must not import gateway source at runtime or typecheck time.
- Each route module under `apps/api-gateway/src/routes/*` exports `export type AppType = ReturnType<typeof createXRoutes>` for hono-docs (handler behaviour unchanged).
- **`openapi-ts.config.mjs`** reads **`internal.openapi.json` only** and generates the committed SDK under `packages/api-client/src/generated`. It does **not** read `public.openapi.json`.
- A second spec, `public.openapi.json`, is generated for Swagger UI only (`publicDocs: true` domains). See [ADR 0009](0009-internal-vs-public-openapi.md).
- **`createApiClient(options)`** wraps the generated fetch client with `baseUrl`, default `init`, and optional `getAccessToken` (manual `Authorization` wins).
- Generated **spec files and SDK output are committed**; CI enforces freshness with `pnpm api check`.

### Why not Hono RPC (`hc`) types anymore

Hono RPC declaration emit from `createApp()` produced a large `apiApp.types.ts` skeleton tied to `hono/client`. OpenAPI gives a standard contract, a browsable spec, and a fetch-based SDK that does not require `hc` chaining (`api.profiles[':id'].$get`). Frontends call generated functions (e.g. `getProfilesById({ client, path: { id } })`).

### Why not `@supabase/supabase-js`-style “import the server package”

Same boundary as [ADR 0004](0004-api-gateway-supabase-server-auth.md): shared libraries sit in `packages/*`; **composition happens in apps**. Codegen at the repo root (like `pnpm db types`, `pnpm rls sync`) is the approved cross-cutting bridge when a package needs artifacts derived from an app.

## Consequences

- **Positive:** Clear dependency direction — gateway → packages via composition; client → generated contract only.
- **Positive:** Public OpenAPI + Swagger UI for integrators (see [ADR 0009](0009-internal-vs-public-openapi.md)).
- **Positive:** CI can enforce freshness with `pnpm api check` (regenerate OpenAPI + client, then `git diff --exit-code`).
- **Trade-off:** After route/handler changes, developers must run `pnpm api generate` and commit the updated spec files plus `packages/api-client/src/generated`.
- **Trade-off:** hono-docs infers schemas from handler return types; complex shapes may be wider than strict Zod contracts until handlers expose tighter types.

## Commands

```sh
pnpm api openapi    # regenerate internal + public OpenAPI specs
pnpm api client     # regenerate packages/api-client/src/generated
pnpm api generate   # openapi then client
pnpm api check      # generate and fail if git diff is non-empty
```

Run after changing gateway routes, mount paths, or handler input/output types that frontends should see.

## References

- Config: `apps/api-gateway/hono-docs.ts`, `hono-docs.internal.ts`, `hono-docs.public.ts`, `openapi-ts.config.mjs`
- OpenAPI outputs: `apps/api-gateway/openapi/internal.openapi.json`, `apps/api-gateway/openapi/public.openapi.json`
- SDK output: `packages/api-client/src/generated`
- Client wrapper: `packages/api-client/src/client.ts`, `packages/api-client/README.md`
- Gateway app factory: `apps/api-gateway/src/app/create-app.ts`
- Public docs: `apps/api-gateway/src/routes/docs.ts`
- CLI: `tools/commands/api.ts`
- Dual-spec decision: [ADR 0009](0009-internal-vs-public-openapi.md)
- Dependency direction: [Architecture — Dependency direction](../architecture.md#dependency-direction)
