import { API_PATHS } from '@aida/contracts';
import { ApiError } from '@aida/api-client/http';
import { createMiddleware } from 'hono/factory';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app/create-app';
import * as organizationsCompositionModule from '../composition/organizations';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';

const authUserId = '00000000-0000-4000-8000-000000000001';

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

function createOrgsTestApp(context: AidaSupabaseContext = createMockSupabaseContext()) {
    const authMiddleware = createMiddleware(async (c, next) => {
        c.set('supabaseContext', context);

        if (!c.get('supabaseContext')?.userClaims?.id) {
            throw ApiError.unauthenticated();
        }

        await next();
    });

    return createApp({ authMiddleware, corsAllowedOrigins: [] });
}

describe('POST /orgs', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('maps Supabase-like create errors to a bad request with a safe organisation message', async () => {
        vi.spyOn(organizationsCompositionModule, 'createOrganizationUseCases').mockReturnValue({
            createOrganization: vi.fn().mockRejectedValue({
                code: '23505',
                message: 'duplicate key value violates unique constraint "organizations_slug_key"',
            }),
        } as never);

        const app = createOrgsTestApp();
        const res = await app.request(API_PATHS.orgs.list, {
            method: 'POST',
            body: JSON.stringify({
                name: 'Acme',
                slug: 'acme',
            }),
            headers: {
                'content-type': 'application/json',
            },
        });

        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body).toEqual({
            success: false,
            error: {
                code: 'request.invalid',
                message: 'Could not create organisation',
                details: {
                    reason: 'duplicate key value violates unique constraint "organizations_slug_key"',
                },
            },
            requestId: expect.any(String),
        });
    });
});
