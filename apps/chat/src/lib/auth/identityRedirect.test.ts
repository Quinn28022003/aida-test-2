import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { describe, expect, it, vi } from 'vitest';

import {
    buildIdentityAuthRedirectUrl,
    buildIdentityLoginRedirect,
    buildIdentityLoginRedirectFromLocation,
    resolveProductReturnTo,
} from './identityRedirect';

vi.mock('@aida/config/public', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/config/public')>();

    return {
        ...actual,
        getChatPublicEnv: vi.fn(() => ({
            NEXT_PUBLIC_IDENTITY_DOMAIN: 'http://localhost:3006',
        })),
    };
});

describe('buildIdentityLoginRedirect', () => {
    it('builds identity login URL with encoded full return URL', () => {
        expect(buildIdentityLoginRedirect('http://localhost:3000/inbox?q=1')).toBe(
            'http://localhost:3006/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2Finbox%3Fq%3D1',
        );
    });
});

describe('buildIdentityLoginRedirectFromLocation', () => {
    it('encodes pathname and search into returnTo', () => {
        const searchParams = new URLSearchParams('tab=1');
        expect(
            buildIdentityLoginRedirectFromLocation(
                'http://localhost:3000',
                '/inbox',
                searchParams,
            ),
        ).toBe(
            'http://localhost:3006/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2Finbox%3Ftab%3D1',
        );
    });
});

describe('buildIdentityAuthRedirectUrl', () => {
    it('maps legacy next param to a product-origin return URL', () => {
        const searchParams = new URLSearchParams({ next: '/settings' });
        Object.defineProperty(window, 'location', {
            value: { origin: 'http://localhost:3000' },
            writable: true,
        });

        expect(buildIdentityAuthRedirectUrl(IDENTITY_AUTH_PATHS.login, searchParams)).toBe(
            'http://localhost:3006/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2Fsettings',
        );
    });
});

describe('resolveProductReturnTo', () => {
    it('prefers returnTo over next', () => {
        const searchParams = new URLSearchParams({
            returnTo: 'http://localhost:3001/',
            next: '/ignored',
        });

        expect(resolveProductReturnTo(searchParams)).toBe('http://localhost:3001/');
    });
});
