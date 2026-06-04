import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDefaultReturnDestination, resolveReturnTo } from './redirect';

vi.mock('@aida/config/public', () => ({
    getIdentityPublicEnv: vi.fn(() => ({
        NEXT_PUBLIC_CHAT_DOMAIN: 'http://localhost:3000',
        NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    })),
    parseCommaSeparatedOrigins: (raw: string) =>
        raw.split(',').map((origin) => origin.trim()).filter(Boolean),
}));

afterEach(() => {
    vi.clearAllMocks();
});

describe('resolveReturnTo', () => {
    it('returns allowed returnTo URLs unchanged', () => {
        expect(resolveReturnTo('http://localhost:3001/vault/path?q=1#section')).toBe(
            'http://localhost:3001/vault/path?q=1#section',
        );
    });

    it('falls back to chat home for disallowed external origins', () => {
        expect(resolveReturnTo('https://evil.example/phish')).toBe('http://localhost:3000/');
    });

    it('falls back to chat home for malformed URLs', () => {
        expect(resolveReturnTo('not-a-url')).toBe('http://localhost:3000/');
    });

    it('falls back to chat home when returnTo is missing', () => {
        expect(resolveReturnTo(null)).toBe('http://localhost:3000/');
    });
});

describe('getDefaultReturnDestination', () => {
    it('normalises chat domain to a trailing slash home path', () => {
        expect(getDefaultReturnDestination()).toBe('http://localhost:3000/');
    });
});
