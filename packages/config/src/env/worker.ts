/**
 * Background service environment (`workerEnvSchema` via {@link getWorkerEnv}).
 *
 * Uses {@link coreBackendEnvSchema} only — not API Gateway fields such as
 * `SUPABASE_PUBLISHABLE_KEY`, `CORS_ALLOWED_ORIGINS`, or Bedrock router models.
 */
import { workerEnvSchema, type WorkerEnv } from '../schemas/env';
import { createCachedProcessEnvGetter } from '../utils/cached-process-env';

export { workerEnvSchema, type WorkerEnv };

const workerEnv = createCachedProcessEnvGetter(workerEnvSchema);

/**
 * Reset the cached worker env. Useful for testing.
 * @internal
 */
export const resetWorkerEnvCache = workerEnv.reset;

/**
 * Get worker environment variables - backend only, contains secrets.
 * Validates required worker env vars and returns them with proper types.
 * Results are cached for subsequent calls.
 * Never import this in frontend code.
 */
export function getWorkerEnv(): WorkerEnv {
    return workerEnv.get();
}
