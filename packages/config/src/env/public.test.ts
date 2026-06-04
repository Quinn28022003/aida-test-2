import { afterEach, describe, expect, it } from 'vitest';

import {
    getIdentityPublicEnv,
    parseCommaSeparatedOrigins,
    resetPublicEnvCache,
} from './public';

const identityEnv: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'anon-key',
    NEXT_PUBLIC_CHAT_DOMAIN: 'http://localhost:3000',
    NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    NEXT_PUBLIC_POSTHOG_KEY: undefined,
    NEXT_PUBLIC_POSTHOG_HOST: undefined,
};

function setIdentityEnv(overrides: Record<string, string | undefined> = {}): void {
    for (const [key, value] of Object.entries({ ...identityEnv, ...overrides })) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
}

afterEach(() => {
    resetPublicEnvCache();
    for (const key of Object.keys(identityEnv)) {
        delete process.env[key];
    }
});

describe('getIdentityPublicEnv', () => {
    it('parses required identity public env vars', () => {
        setIdentityEnv();

        expect(getIdentityPublicEnv()).toEqual({
            NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'anon-key',
            NEXT_PUBLIC_CHAT_DOMAIN: 'http://localhost:3000',
            NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS:
                'http://localhost:3000,http://localhost:3001',
            NEXT_PUBLIC_POSTHOG_KEY: undefined,
            NEXT_PUBLIC_POSTHOG_HOST: undefined,
        });
    });

    it('throws when required vars are missing', () => {
        setIdentityEnv({ NEXT_PUBLIC_CHAT_DOMAIN: undefined });

        expect(() => getIdentityPublicEnv()).toThrow(/Invalid environment variables/);
    });

    it('re-parses after resetPublicEnvCache', () => {
        setIdentityEnv();
        getIdentityPublicEnv();

        resetPublicEnvCache();
        setIdentityEnv({ NEXT_PUBLIC_CHAT_DOMAIN: 'http://localhost:4000' });

        expect(getIdentityPublicEnv().NEXT_PUBLIC_CHAT_DOMAIN).toBe('http://localhost:4000');
    });
});

describe('parseCommaSeparatedOrigins', () => {
    it('splits, trims, and drops empty entries from allowed origins string', () => {
        expect(
            parseCommaSeparatedOrigins(' http://localhost:3000 , http://localhost:3001, ,'),
        ).toEqual(['http://localhost:3000', 'http://localhost:3001']);
    });
});
