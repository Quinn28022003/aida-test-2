import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { describe, expect, it, vi } from 'vitest';

import {
    buildIdentityAuthRedirectUrl,
    buildIdentityLoginRedirect,
    resolveProductReturnTo,
} from './identityRedirect';

vi.mock('@aida/config/public', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/config/public')>();

    return {
        ...actual,
        getVaultPublicEnv: vi.fn(() => ({
            NEXT_PUBLIC_IDENTITY_DOMAIN: 'http://localhost:3006',
        })),
    };
});

describe('buildIdentityLoginRedirect', () => {
    it('builds identity login URL with encoded full return URL', () => {
        expect(buildIdentityLoginRedirect('http://localhost:3001/account')).toBe(
            'http://localhost:3006/login?returnTo=http%3A%2F%2Flocalhost%3A3001%2Faccount',
        );
    });
});

describe('buildIdentityAuthRedirectUrl', () => {
    it('maps legacy next param to a product-origin return URL', () => {
        const searchParams = new URLSearchParams({ next: '/account' });
        Object.defineProperty(window, 'location', {
            value: { origin: 'http://localhost:3001' },
            writable: true,
        });

        expect(buildIdentityAuthRedirectUrl(IDENTITY_AUTH_PATHS.login, searchParams)).toBe(
            'http://localhost:3006/login?returnTo=http%3A%2F%2Flocalhost%3A3001%2Faccount',
        );
    });
});

describe('resolveProductReturnTo', () => {
    it('defaults to the current app origin home', () => {
        Object.defineProperty(window, 'location', {
            value: { origin: 'http://localhost:3001' },
            writable: true,
        });

        expect(resolveProductReturnTo(new URLSearchParams())).toBe('http://localhost:3001/');
    });
});
