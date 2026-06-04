import { withSupabase } from '@supabase/server/adapters/hono';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import {
    getAdminSupabaseClient,
    getAuthMode,
    getJwtClaims,
    getSupabaseContext,
    getUserClaims,
    getUserSupabaseClient,
} from './context';
import type { AidaSupabaseContext } from './supabase-context.types';

function createMockContext(overrides?: Partial<AidaSupabaseContext>): AidaSupabaseContext {
    const client = {
        supabaseUrl: 'https://example.supabase.co',
        supabaseKey: 'publishable-key',
    };

    return {
        supabase: client as AidaSupabaseContext['supabase'],
        supabaseAdmin: {
            ...client,
            supabaseKey: 'secret-key',
        } as AidaSupabaseContext['supabaseAdmin'],
        userClaims: {
            id: '770e8400-e29b-41d4-a716-446655440002',
            email: 'user@example.com',
            role: 'authenticated',
        },
        jwtClaims: { sub: '770e8400-e29b-41d4-a716-446655440002' },
        authMode: 'user',
        ...overrides,
    };
}

describe('Supabase server helpers', () => {
    it('exposes context accessors without exposing secret keys on the user client', async () => {
        const mockContext = createMockContext();

        const app = new Hono<{ Variables: { supabaseContext: AidaSupabaseContext } }>();
        app.get('/protected', async (c, next) => {
            c.set('supabaseContext', mockContext);
            await next();
        }, (c) => {
            const userClient = getUserSupabaseClient(c);
            const adminClient = getAdminSupabaseClient(c);

            return c.json({
                userKey: userClient.supabaseKey,
                adminKey: adminClient.supabaseKey,
            });
        });

        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer test-token' },
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.userKey).toBe('publishable-key');
        expect(body.adminKey).toBe('secret-key');
        expect(body.userKey).not.toBe(body.adminKey);
        expect(body).not.toHaveProperty('userClaims');
        expect(body).not.toHaveProperty('jwtClaims');
        expect(body).not.toHaveProperty('authMode');
    });

    it('skips context creation when a previous middleware already set it', async () => {
        const mockContext = createMockContext();
        let innerInvoked = false;

        const app = new Hono<{ Variables: { supabaseContext: AidaSupabaseContext } }>();
        app.use('*', async (c, next) => {
            c.set('supabaseContext', mockContext);
            await next();
        });
        app.use('*', async (c, next) => {
            innerInvoked = true;
            await withSupabase({ auth: 'user' })(c, next);
        });
        app.get('/protected', (c) => c.json({ ok: true }));

        const res = await app.request('/protected');

        expect(res.status).toBe(200);
        expect(innerInvoked).toBe(true);
        expect(mockContext.userClaims?.id).toBe('770e8400-e29b-41d4-a716-446655440002');
    });

    it('returns server-only auth metadata from context', async () => {
        const mockContext = createMockContext();

        const app = new Hono<{ Variables: { supabaseContext: AidaSupabaseContext } }>();
        app.get('/protected', (c) => {
            c.set('supabaseContext', mockContext);
            const context = getSupabaseContext(c);

            return c.json({
                userId: getUserClaims(c)?.id,
                jwtSub: getJwtClaims(c)?.sub,
                authMode: getAuthMode(c),
                sameContext: context === mockContext,
            });
        });

        const res = await app.request('/protected');

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            userId: '770e8400-e29b-41d4-a716-446655440002',
            jwtSub: '770e8400-e29b-41d4-a716-446655440002',
            authMode: 'user',
            sameContext: true,
        });
    });
});
