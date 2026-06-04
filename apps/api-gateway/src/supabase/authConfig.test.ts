import type { ServerEnv } from '@aida/config/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildSupabaseAuthConfig } from './authConfig';

const baseEnv = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_PUBLISHABLE_KEY: 'anon-key',
} as ServerEnv;

describe('buildSupabaseAuthConfig', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches JWKS from the project URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ keys: [{ kty: 'EC', kid: 'fetched' }] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const config = await buildSupabaseAuthConfig(baseEnv);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.supabase.co/auth/v1/.well-known/jwks.json',
        );
        expect(config.auth).toBe('user');
        expect(config.env?.jwks).toEqual({ keys: [{ kty: 'EC', kid: 'fetched' }] });
        expect(config.env?.publishableKeys).toEqual({ default: 'anon-key' });
    });

    it('throws when JWKS has no keys', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ keys: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        await expect(buildSupabaseAuthConfig(baseEnv)).rejects.toThrow(
            /requires Supabase JWKS with at least one key/,
        );
    });

    it('maps SUPABASE_SERVICE_ROLE_KEY into secret keys', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ keys: [{ kty: 'RSA', kid: 'test' }] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const config = await buildSupabaseAuthConfig({
            ...baseEnv,
            SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        });

        expect(config.env?.secretKeys.default).toBe('service-role-key');
    });

    it('strips a trailing slash from SUPABASE_URL when fetching JWKS', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ keys: [{ kty: 'EC', kid: 'test' }] }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        await buildSupabaseAuthConfig({
            ...baseEnv,
            SUPABASE_URL: 'https://example.supabase.co/',
        });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.supabase.co/auth/v1/.well-known/jwks.json',
        );
    });

    it('throws when JWKS fetch fails', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(buildSupabaseAuthConfig(baseEnv)).rejects.toThrow(
            /Failed to fetch Supabase JWKS/,
        );
    });

    it('throws when JWKS response is not valid JSON shape', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ keys: 'invalid' }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        await expect(buildSupabaseAuthConfig(baseEnv)).rejects.toThrow(/was not valid JSON/);
    });
});
