import { API_PATHS } from '@aida/contracts';
import { ApiError } from '@aida/api-client/http';
import { createMiddleware } from 'hono/factory';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app/create-app';
import * as profilesCompositionModule from '../composition/profiles';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';

const authUserId = 'aa0e8400-e29b-41d4-a716-446655440001';
const otherAuthUserId = 'bb0e8400-e29b-41d4-a716-446655440099';
const profileId = '770e8400-e29b-41d4-a716-446655440002';

function createMockSupabaseContext(): AidaSupabaseContext {
    const baseClient = {
        supabaseUrl: 'https://example.supabase.co',
        supabaseKey: 'publishable-key',
    };

    return {
        supabase: baseClient as AidaSupabaseContext['supabase'],
        supabaseAdmin: {
            ...baseClient,
            supabaseKey: 'secret-key',
        } as AidaSupabaseContext['supabaseAdmin'],
        userClaims: {
            id: authUserId,
            email: 'user@example.com',
            role: 'authenticated',
        },
        jwtClaims: { sub: authUserId },
        authMode: 'user',
    };
}

function createProfilesTestApp(context?: AidaSupabaseContext) {
    const authMiddleware = createMiddleware(async (c, next) => {
        if (context) {
            c.set('supabaseContext', context);
        }

        if (!c.get('supabaseContext')?.userClaims?.id) {
            throw ApiError.unauthenticated();
        }

        await next();
    });

    return createApp({ authMiddleware, corsAllowedOrigins: [] });
}

describe('GET /profiles/:id', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns auth.unauthenticated when no Supabase context is present', async () => {
        const app = createProfilesTestApp();
        const res = await app.request(API_PATHS.profiles.byId(authUserId));

        expect(res.status).toBe(401);

        const body = await res.json();

        expect(body).toEqual({
            success: false,
            error: {
                code: 'auth.unauthenticated',
                message: 'Authentication required',
            },
            requestId: expect.any(String),
        });
    });

    it('returns auth.forbidden when path id does not match authenticated user', async () => {
        const app = createProfilesTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.profiles.byId(otherAuthUserId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(403);

        const body = await res.json();

        expect(body).toEqual({
            success: false,
            error: {
                code: 'auth.forbidden',
                message: 'Forbidden',
            },
            requestId: expect.any(String),
        });
    });

    it('returns the profile for the auth user id in the path', async () => {
        vi.spyOn(profilesCompositionModule, 'createProfileUseCases').mockReturnValue({
            getByAuthUserId: vi.fn().mockResolvedValue({
                id: profileId,
                authUserId,
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: 'Australia/Sydney',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
        } as never);

        const app = createProfilesTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.profiles.byId(authUserId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data.authUserId).toBe(authUserId);
        expect(body.data.displayName).toBe('Quinn');
    });

    it('returns the profile envelope without auth context fields', async () => {
        vi.spyOn(profilesCompositionModule, 'createProfileUseCases').mockReturnValue({
            getByAuthUserId: vi.fn().mockResolvedValue({
                id: profileId,
                authUserId,
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: 'Australia/Sydney',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
        } as never);

        const app = createProfilesTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.profiles.byId(authUserId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body).toEqual({
            success: true,
            data: {
                id: profileId,
                authUserId,
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: 'Australia/Sydney',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            },
            requestId: expect.any(String),
        });
        expect(body.data).not.toHaveProperty('userClaims');
        expect(body.data).not.toHaveProperty('jwtClaims');
        expect(body.data).not.toHaveProperty('role');
    });

    it('returns profile.not_found when the user has no profile row', async () => {
        const { ProfileNotFoundError } = await import('@aida/profiles');

        vi.spyOn(profilesCompositionModule, 'createProfileUseCases').mockReturnValue({
            getByAuthUserId: vi.fn().mockRejectedValue(new ProfileNotFoundError(authUserId)),
        } as never);

        const app = createProfilesTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.profiles.byId(authUserId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(404);

        const body = await res.json();

        expect(body).toEqual({
            success: false,
            error: {
                code: 'profile.not_found',
                message: 'Profile not found',
            },
            requestId: expect.any(String),
        });
    });
});
