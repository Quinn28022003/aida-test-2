import type { MiddlewareHandler } from 'hono';

import type { SupabaseAuthMiddlewareConfig } from '../middleware/supabaseAuth';
import type { AppVariables } from '../context.types';

/** Runtime options used when composing the API gateway Hono app. */
export type CreateAppOptions = {
    /** Supabase auth config used by the default auth middleware. */
    supabaseAuth?: SupabaseAuthMiddlewareConfig;
    /** Replaces the default Supabase auth middleware (for tests). */
    authMiddleware?: MiddlewareHandler<{ Variables: AppVariables }>;
    /** Browser origins allowed for cross-origin API calls (e.g. Chat, Vault). */
    corsAllowedOrigins?: string[];
};
