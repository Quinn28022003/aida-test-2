import { ApiError } from '@aida/api-client/http';
import { createSupabaseContext } from '@supabase/server';
import type { AuthError } from '@supabase/server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppVariables } from '../context.types';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';
import { createSupabaseAuthMiddleware } from './supabaseAuth';

vi.mock('@supabase/server', () => ({
    createSupabaseContext: vi.fn(),
}));

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

function createAuthError(message = 'Invalid credentials'): AuthError {
    return {
        name: 'InvalidCredentialsError',
        message,
        status: 401,
        code: 'invalid_credentials',
    } as AuthError;
}

function createTestApp() {
    const app = new Hono<{ Variables: AppVariables }>();

    app.onError((error, c) => {
        if (error instanceof HTTPException) {
            return c.json({ message: error.message }, error.status as never);
        }

        if (error instanceof ApiError) {
            return c.json({ code: error.code, message: error.message }, error.status as never);
        }

        return c.json({ message: 'Unexpected error' }, 500);
    });

    app.use('*', createSupabaseAuthMiddleware());
    app.get('/protected', (c) => {
        const context = c.get('supabaseContext');

        return c.json({
            userId: context.userClaims?.id,
            authMode: context.authMode,
        });
    });

    return app;
}

describe('createSupabaseAuthMiddleware', () => {
    beforeEach(() => {
        vi.mocked(createSupabaseContext).mockReset();
    });

    it('verifies bearer credentials from the Authorization header', async () => {
        vi.mocked(createSupabaseContext).mockResolvedValue({
            data: createMockContext(),
            error: null,
        });

        const app = createTestApp();
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer explicit-token' },
        });

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toEqual({
            userId: '770e8400-e29b-41d4-a716-446655440002',
            authMode: 'user',
        });

        const request = vi.mocked(createSupabaseContext).mock.calls[0]?.[0] as Request;

        expect(request.headers.get('Authorization')).toBe('Bearer explicit-token');
    });

    it('returns unauthenticated when no Authorization header is present', async () => {
        vi.mocked(createSupabaseContext).mockResolvedValue({
            data: null,
            error: createAuthError(),
        });

        const app = createTestApp();
        const res = await app.request('/protected');

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toEqual({ message: 'Invalid credentials' });

        const request = vi.mocked(createSupabaseContext).mock.calls[0]?.[0] as Request;

        expect(request.headers.get('Authorization')).toBeNull();
    });

    it('requires verified user claims after Supabase context creation', async () => {
        vi.mocked(createSupabaseContext).mockResolvedValue({
            data: createMockContext({ userClaims: null }),
            error: null,
        });

        const app = createTestApp();
        const res = await app.request('/protected', {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(401);
        await expect(res.json()).resolves.toEqual({
            code: 'auth.unauthenticated',
            message: 'Authentication required',
        });
    });
});
