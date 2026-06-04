# ADR 0009: Internal vs Public OpenAPI Specifications

## Status

Accepted

## Related documentation

- [ADR 0005: API Client via OpenAPI Codegen](0005-api-client-types-codegen.md) — why `@aida/api-client` does not depend on `apps/api-gateway`, and the overall codegen pipeline.
- [ADR 0004: API Gateway Auth with Supabase Server](0004-api-gateway-supabase-server-auth.md) — Bearer JWT on API routes (separate from unauthenticated `/docs/public`).
- [Monorepo — API OpenAPI and client CLI](../monorepo.md#api-openapi-and-client-cli)
- [packages/api-client/README.md](../../packages/api-client/README.md)

## Context

AIDA generates OpenAPI from the API Gateway’s Hono route modules. Two audiences need different views of that surface:

| Audience | Need |
| -------- | ---- |
| **First-party apps** (Chat, Vault) | Typed access to **every** secured route the gateway mounts today. |
| **Integrators / reviewers** | A **smaller**, intentionally published contract and Swagger UI without exposing the full internal API surface. |

A single merged spec cannot satisfy both: publishing everything in Swagger would document routes we do not want to advertise; generating the frontend SDK from a filtered “public” spec would omit endpoints Chat and Vault still call.

We also rejected serving an “internal” Swagger UI over HTTP (with or without an API key): the internal contract stays in the repository and CI; only the public subset is browsable at runtime.

## Decision

Maintain **two committed OpenAPI JSON files** from the same route source, with **one SDK codegen input**.

```text
apps/api-gateway/src/routes/<domain>.ts  (export type AppType)
        |
        +-- hono-docs.internal.ts  (all API_ROUTE_MOUNTS)
        |       -> openapi/internal.openapi.json
        |               -> openapi-ts.config.mjs
        |               -> packages/api-client/src/generated
        |
        +-- hono-docs.public.ts  (mounts where publicDocs === true)
                -> openapi/public.openapi.json
                        -> GET /docs/public (Swagger UI, no auth)
```

### Internal spec (`internal.openapi.json`)

- **Generator:** [`apps/api-gateway/hono-docs.internal.ts`](../../apps/api-gateway/hono-docs.internal.ts) — `createApiGroups(() => true)`.
- **Consumers:** `@hey-api/openapi-ts` via [`openapi-ts.config.mjs`](../../openapi-ts.config.mjs) → [`packages/api-client/src/generated`](../../packages/api-client/src/generated).
- **Not served over HTTP** — no `/docs/internal` route.

### Public spec (`public.openapi.json`)

- **Generator:** [`apps/api-gateway/hono-docs.public.ts`](../../apps/api-gateway/hono-docs.public.ts) — `createApiGroups((mount) => mount.publicDocs)`.
- **Consumers:** [`createPublicDocsRoutes`](../../apps/api-gateway/src/routes/docs.ts) at `GET /docs/public` and `GET /docs/public/openapi.json`.
- **Opt-in per domain:** set `publicDocs: true` on the mount in [`packages/contracts/src/api/constants/paths/tree.ts`](../../packages/contracts/src/api/constants/paths/tree.ts), then run `pnpm api openapi`.

### SDK uses internal only

[`openapi-ts.config.mjs`](../../openapi-ts.config.mjs) sets `input: './apps/api-gateway/openapi/internal.openapi.json'`. We do **not** generate a second client from `public.openapi.json`.

Reasons:

- First-party apps need the full mounted surface in one package.
- Two generated SDKs would drift and invite wrong imports (`getX` exists only in one).
- Public documentation is a **view** of the API, not the source of frontend types.

`baseUrl: false` in codegen: each app configures origin and auth via [`createApiClient`](../../packages/api-client/src/client.ts) (`NEXT_PUBLIC_API_GATEWAY_URL`, `getAccessToken` from Supabase session).

### Swagger runtime behaviour

- Public routes are always mounted; no env gate.
- `GET /docs/public/openapi.json` reads the committed `public.openapi.json` and overrides `servers` at serve time using `API_GATEWAY_DOMAIN` (or `http://localhost:${PORT}` when unset) — see [operations.md](../operations.md).
- Generated `servers` in the file use a neutral placeholder (`/`); deploy URL comes from gateway env, not from the committed JSON.

### Passing `client` to generated functions

Generated helpers (e.g. `getProfilesById`) call `(options.client ?? defaultClient).get(...)`. The default client from codegen has no `baseUrl` or auth. Chat and Vault pass a shared instance from `getApiGatewayClient()`:

```typescript
const { data, error, response } = await getProfilesById({
    client: getApiGatewayClient(),
    path: { id: authUserId },
});
```

## Developer workflow

1. Change handlers or routes in `apps/api-gateway/src/routes/<domain>.ts` (keep `export type AppType` accurate for hono-docs).
2. Optionally set `publicDocs: true` on domains that should appear in Swagger.
3. From repo root: `pnpm api generate` (or `pnpm api openapi` then `pnpm api client`).
4. Commit `internal.openapi.json`, `public.openapi.json`, and `packages/api-client/src/generated`.
5. Pre-commit / CI: `pnpm api check` ([`tools/commands/api.ts`](../../tools/commands/api.ts)) fails if any of those drift from git.

Until at least one mount has `publicDocs: true`, `public.openapi.json` may have empty `paths` and Swagger shows “No operations defined in spec!” — that is expected.

## Alternatives considered

| Option | Outcome |
| ------ | ------- |
| One spec for SDK and Swagger | Rejected — cannot shrink public documentation without starving the SDK. |
| Two SDKs (internal + public packages) | Rejected — duplication, drift, and import confusion. |
| Internal Swagger over HTTP (API key) | Rejected — internal contract stays file + codegen only; public docs stay unauthenticated. |
| Hand-maintained public spec | Rejected — would diverge from Hono handlers immediately. |

## Consequences

- **Positive:** Clear split between “everything we call in product” (internal → SDK) and “what we publish” (public → Swagger).
- **Positive:** One `@aida/api-client` import surface; CI enforces all three artifacts together.
- **Trade-off:** Product must maintain `publicDocs` when exposing domains externally.
- **Trade-off:** Public Swagger may be empty until domains are flagged; internal spec still updates on every `pnpm api openapi`.

## References

- Shared hono-docs config: [`apps/api-gateway/hono-docs.ts`](../../apps/api-gateway/hono-docs.ts)
- OpenAPI outputs: [`apps/api-gateway/openapi/internal.openapi.json`](../../apps/api-gateway/openapi/internal.openapi.json), [`apps/api-gateway/openapi/public.openapi.json`](../../apps/api-gateway/openapi/public.openapi.json)
- Public docs route: [`apps/api-gateway/src/routes/docs.ts`](../../apps/api-gateway/src/routes/docs.ts)
- Route mount metadata: [`packages/contracts/src/api/constants/paths/index.ts`](../../packages/contracts/src/api/constants/paths/index.ts)
