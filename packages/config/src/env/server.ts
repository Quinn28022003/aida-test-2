/**
 * API Gateway environment (`serverEnvSchema` via {@link getServerEnv}).
 *
 * User access tokens are verified with `@supabase/server` `withSupabase({ auth: 'user' })`
 * using asymmetric JWKS from the project `/.well-known/jwks.json` (fetched from `SUPABASE_URL` at startup).
 * Legacy HS256 verification via `SUPABASE_JWT_SECRET` is not supported — remove it from `.env`.
 */
import { serverEnvSchema, type ServerEnv } from '../schemas/env';
import { createCachedProcessEnvGetter } from '../utils/cached-process-env';

export { serverEnvSchema, type ServerEnv };

const serverEnv = createCachedProcessEnvGetter(serverEnvSchema);

/**
 * Reset the cached server env. Useful for testing.
 * @internal
 */
export const resetServerEnvCache = serverEnv.reset;

/**
 * Get server environment variables - backend only, contains secrets.
 * Validates required server env vars and returns them with proper types.
 * Results are cached for subsequent calls.
 * Never import this in frontend code.
 */
export function getServerEnv(): ServerEnv {
    return serverEnv.get();
}
