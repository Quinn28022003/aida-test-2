/**
 * @hey-api/openapi-ts config for `@aida/api-client`.
 *
 * Regenerates `packages/api-client/src/generated` from the **internal** OpenAPI spec only.
 * Public spec (`apps/api-gateway/openapi/public.openapi.json`) is for Swagger at `/docs/public`
 * and is intentionally not used here — see docs/adrs/0009-internal-vs-public-openapi.md.
 *
 * @example
 * pnpm api openapi   # hono-docs → internal.openapi.json + public.openapi.json
 * pnpm api client    # runs openapi-ts with this file
 * pnpm api generate  # openapi then client
 * pnpm api check     # generate + git diff on specs and generated/
 */
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    /** All gateway mounts — run `pnpm api openapi` after route/handler changes. */
    input: './apps/api-gateway/openapi/internal.openapi.json',
    output: {
        /** Committed SDK; import via `@aida/api-client` or `@aida/api-client/generated`. */
        path: './packages/api-client/src/generated',
        format: 'prettier',
    },
    plugins: [
        {
            name: '@hey-api/client-fetch',
            /**
             * No default origin in generated client. Each app sets baseUrl + auth via
             * `createApiClient()` (e.g. `NEXT_PUBLIC_API_GATEWAY_URL`, `getAccessToken`).
             */
            baseUrl: false,
        },
    ],
});
