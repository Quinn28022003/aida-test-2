import type { ServerEnv } from '@aida/config/server';
import type { WithSupabaseConfig } from '@supabase/server';

type JsonWebKeySet = { keys: Record<string, unknown>[] };

/** Auth config passed into Supabase's Hono adapter for API gateway requests. */
export type ApiGatewaySupabaseAuthConfig = WithSupabaseConfig;

/** Fetches the Supabase project's JWKS used to verify asymmetric user JWTs. */
async function fetchSupabaseJwks(supabaseUrl: string): Promise<JsonWebKeySet> {
    const jwksUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;

    const response = await fetch(jwksUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch Supabase JWKS from ${jwksUrl} (${response.status}). ` +
            'Check SUPABASE_URL matches the linked Supabase project.',
        );
    }

    const body: unknown = await response.json();
    if (
        typeof body !== 'object' ||
        body === null ||
        !('keys' in body) ||
        !Array.isArray((body as JsonWebKeySet).keys)
    ) {
        throw new Error(`Supabase JWKS response from ${jwksUrl} was not valid JSON.`);
    }

    return body as JsonWebKeySet;
}

/** Builds the Supabase adapter env from validated API gateway environment variables. */
function buildBaseEnv(env: ServerEnv) {
    const publishableKeys: Record<string, string> = {};
    if (env.SUPABASE_PUBLISHABLE_KEY) {
        publishableKeys.default = env.SUPABASE_PUBLISHABLE_KEY;
    }

    return {
        url: env.SUPABASE_URL,
        publishableKeys,
        secretKeys: { default: env.SUPABASE_SERVICE_ROLE_KEY },
    };
}

/**
 * Builds {@link WithSupabaseConfig} for user JWT auth from validated server env.
 * Fetches JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` at startup.
 */
export async function buildSupabaseAuthConfig(
    env: ServerEnv,
): Promise<ApiGatewaySupabaseAuthConfig> {
    const baseEnv = buildBaseEnv(env);
    const jwks = await fetchSupabaseJwks(env.SUPABASE_URL);

    console.log('[api-gateway] Loaded Supabase JWKS from project URL');

    if (jwks.keys.length === 0) {
        throw new Error(
            'API gateway requires Supabase JWKS with at least one key for asymmetric JWT verification. ' +
            'Configure JWT Signing Keys in the Supabase project (Settings → JWT Keys) so ' +
            '/.well-known/jwks.json returns signing keys.',
        );
    }

    return {
        auth: 'user',
        env: {
            ...baseEnv,
            jwks,
        },
    };
}
