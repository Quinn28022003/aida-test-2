# @aida/api-client

OpenAPI fetch client and shared API response helpers for the AIDA API Gateway.

## HTTP responses

Standard AIDA envelope (`@aida/contracts`):

- Success: `{ success: true, data, requestId }`
- Failure: `{ success: false, error: { code, message, details? }, requestId }`

### Web `Response` (any server runtime)

```typescript
import { ApiResponse } from '@aida/api-client/http';

return ApiResponse.success({ requestId, data: { status: 'ok' } });
return ApiResponse.unauthorized(requestId);
return ApiResponse.badRequest(requestId, 'Invalid input', { field: 'email' });
```

### Hono

```typescript
import { failureJson, successJson } from '@aida/api-client/http';

app.get('/health', (c) => successJson(c, { status: 'ok' }));

return failureJson(c, { code: 'auth.forbidden', message: 'Forbidden' }, 403);
```

Requires `requestId` on Hono context (set by request-id middleware before handlers that need it).

## API client

The gateway authenticates browser requests with `Authorization: Bearer <access_token>`, verified by `@supabase/server` and asymmetric JWKS — see [docs/operations.md — API Gateway authentication](../../docs/operations.md#api-gateway-authentication-supabase-user-jwt). Chat and Vault wire `getAccessToken` to `supabase.auth.getSession()` so `@supabase/ssr` reads the shared session cookie set by Identity.

```typescript
import { createApiClient, getOrgs } from '@aida/api-client';

const client = createApiClient({
    baseUrl: 'http://localhost:3002',
    init: {
        credentials: 'include',
    },
    getAccessToken: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token;
    },
});

const { data, response } = await getOrgs({ client });
```

`getAccessToken` runs before each request when the caller did not set `Authorization`. `init` is merged into every request; per-call headers on SDK functions are preserved.

Pass `client` on every generated call. The codegen default client has no `baseUrl` or auth; Chat and Vault use a singleton from `getApiGatewayClient()` in each app’s `src/lib/api/gatewayClient.ts`.

```typescript
import { getProfilesById } from '@aida/api-client';
import { getApiGatewayClient } from '@/lib/api/gatewayClient';

const { data, error, response } = await getProfilesById({
    client: getApiGatewayClient(),
    path: { id: authUserId },
});
```

For Next.js SSR cookie flows, refresh the session with `@supabase/ssr`; the API client only forwards browser credentials and leaves auth verification to the gateway.

## OpenAPI inputs and codegen

The gateway emits **two** OpenAPI files from the same Hono route modules. Only **internal** feeds this package.

| Artifact | Path | Used for |
| -------- | ---- | -------- |
| Internal spec | `apps/api-gateway/openapi/internal.openapi.json` | `@hey-api/openapi-ts` → `src/generated` (Chat, Vault, CI) |
| Public spec | `apps/api-gateway/openapi/public.openapi.json` | Swagger UI at `GET /docs/public` only — **not** imported here |
| Generated SDK | `packages/api-client/src/generated` | Committed; import via `@aida/api-client` |

Set `publicDocs: true` on a domain in `packages/contracts/src/api/constants/paths/tree.ts` to include it in the public spec. First-party apps still use the internal spec for types regardless.

From the repo root:

```sh
pnpm api openapi    # regenerate internal + public OpenAPI JSON
pnpm api client     # regenerate src/generated from internal.openapi.json only
pnpm api generate   # openapi then client
pnpm api check      # generate and fail if internal, public, or generated drift
```

Run after gateway route or handler changes. See [ADR 0005](../../docs/adrs/0005-api-client-types-codegen.md) and [ADR 0009](../../docs/adrs/0009-internal-vs-public-openapi.md).
