import type { AidaSupabaseContext } from './supabase-context.types';

/** Hono variable key used by `withSupabase` to store request-scoped Supabase context. */
export const SUPABASE_CONTEXT_KEY = 'supabaseContext';

export type SupabaseHonoVariables = {
    [SUPABASE_CONTEXT_KEY]: AidaSupabaseContext;
};

type SupabaseContextReader = {
    get(key: typeof SUPABASE_CONTEXT_KEY): AidaSupabaseContext;
};

/** Returns the Supabase context attached to the current Hono request. */
export function getSupabaseContext(c: SupabaseContextReader): AidaSupabaseContext {
    return c.get(SUPABASE_CONTEXT_KEY);
}

/** Returns the user-scoped Supabase client for the authenticated request. */
export function getUserSupabaseClient(c: SupabaseContextReader) {
    return getSupabaseContext(c).supabase;
}

/** Returns the admin Supabase client for server-side privileged operations. */
export function getAdminSupabaseClient(c: SupabaseContextReader) {
    return getSupabaseContext(c).supabaseAdmin;
}

/** Server-only: user claims from the verified token. Do not use in route response bodies. */
export function getUserClaims(c: SupabaseContextReader) {
    return getSupabaseContext(c).userClaims;
}

/** Server-only: raw JWT claims from the verified token. Do not use in route response bodies. */
export function getJwtClaims(c: SupabaseContextReader) {
    return getSupabaseContext(c).jwtClaims;
}

/** Server-only: Supabase auth mode for the request. Do not use in route response bodies. */
export function getAuthMode(c: SupabaseContextReader) {
    return getSupabaseContext(c).authMode;
}
