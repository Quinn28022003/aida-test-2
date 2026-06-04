import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiError } from '@aida/api-client/http';
import { API_APP_WIRING, API_PATHS, API_ROUTE_MOUNTS } from '@aida/contracts';
import type { ApiRouteMountDomain } from '@aida/contracts';
import { createMiddleware } from 'hono/factory';
import * as serverConfig from '@aida/config/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAgentsRoutes } from '../routes/agents';
import { createAuditRoutes } from '../routes/audit';
import { createAuthRoutes } from '../routes/auth';
import { createConversationsRoutes } from '../routes/conversations';
import { createHandoffsRoutes } from '../routes/handoffs';
import { createInvitationsRoutes } from '../routes/invitations';
import { createMeRoutes } from '../routes/me';
import { createMembersRoutes } from '../routes/members';
import { createMentionsRoutes } from '../routes/mentions';
import { createMessagesRoutes } from '../routes/messages';
import { createOrgsRoutes } from '../routes/orgs';
import { createProfilesRoutes } from '../routes/profiles';
import { createProjectsRoutes } from '../routes/projects';
import { createRouterRoutes } from '../routes/router';
import { createTasksRoutes } from '../routes/tasks';
import { createToolsRoutes } from '../routes/tools';
import { createVaultRoutes } from '../routes/vault';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';
import { createApp } from './create-app';
import {
    domainMiddlewareFactories,
    errorHandlerFactories,
    rootMiddlewareFactories,
} from './wiring';

const requestId = '550e8400-e29b-41d4-a716-446655440000';
const userId = '770e8400-e29b-41d4-a716-446655440002';
const docsDir = join(dirname(fileURLToPath(import.meta.url)), '../../openapi');

type RouteFactory = () => { routes: { method: string; path: string }[] };

const routeFactories = {
    auth: createAuthRoutes,
    me: createMeRoutes,
    orgs: createOrgsRoutes,
    projects: createProjectsRoutes,
    members: createMembersRoutes,
    profiles: createProfilesRoutes,
    invitations: createInvitationsRoutes,
    conversations: createConversationsRoutes,
    messages: createMessagesRoutes,
    agents: createAgentsRoutes,
    router: createRouterRoutes,
    mentions: createMentionsRoutes,
    handoffs: createHandoffsRoutes,
    vault: createVaultRoutes,
    tools: createToolsRoutes,
    tasks: createTasksRoutes,
    audit: createAuditRoutes,
} satisfies Record<ApiRouteMountDomain, RouteFactory>;

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
            id: userId,
            email: 'user@example.com',
            role: 'authenticated',
        },
        jwtClaims: { sub: userId },
        authMode: 'user',
    };
}

function createTestApp() {
    const mockAuthMiddleware = createMiddleware(async (c, next) => {
        const authorization = c.req.header('Authorization');

        if (!authorization?.startsWith('Bearer ') || authorization.slice(7) !== 'valid-token') {
            throw ApiError.unauthenticated();
        }

        c.set('supabaseContext', createMockSupabaseContext());
        await next();
    });

    return createApp({
        authMiddleware: mockAuthMiddleware,
        corsAllowedOrigins: ['http://localhost:3000'],
    });
}

function joinPath(...parts: string[]) {
    return parts.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

describe('API gateway skeleton', () => {
    it('generates a request id when none is provided', async () => {
        const app = createTestApp();
        const res = await app.request(API_PATHS.orgs.list);

        expect(res.status).toBe(401);

        const body = await res.json();

        expect(body.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(res.headers.get('x-request-id')).toBe(body.requestId);
    });

    it('propagates an incoming x-request-id header', async () => {
        const app = createTestApp();
        const res = await app.request(API_PATHS.orgs.list, {
            headers: { 'x-request-id': requestId },
        });

        const body = await res.json();

        expect(body.requestId).toBe(requestId);
        expect(res.headers.get('x-request-id')).toBe(requestId);
    });

    it('allows CORS preflight without authentication', async () => {
        const app = createTestApp();
        const res = await app.request(API_PATHS.profiles.list, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization',
            },
        });

        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
        expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('returns auth.unauthenticated when authorization is missing', async () => {
        const app = createTestApp();
        const res = await app.request(API_PATHS.orgs.list);

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


    it('maps validation failures to request.invalid', async () => {
        const app = createTestApp();
        app.post('/test-validation', () => {
            throw ApiError.badRequest('Request validation failed', {
                issues: [{ path: 'name', message: 'String must contain at least 1 character(s)' }],
            });
        });

        const res = await app.request('/test-validation', { method: 'POST' });

        expect(res.status).toBe(400);

        const body = await res.json();

        expect(body.success).toBe(false);
        expect(body.error.code).toBe('request.invalid');
        expect(body.requestId).toBeTruthy();
    });

    it('maps unhandled errors to internal.error with requestId', async () => {
        const app = createTestApp();
        app.get('/test-error', () => {
            throw new Error('boom');
        });

        const res = await app.request('/test-error', {
            headers: { 'x-request-id': requestId },
        });

        expect(res.status).toBe(500);

        const body = await res.json();

        expect(body).toEqual({
            success: false,
            error: {
                code: 'internal.error',
                message: 'An unexpected error occurred',
            },
            requestId,
        });
    });

    it('maps ApiError instances through the error handler', async () => {
        const app = createTestApp();
        app.get('/test-api-error', () => {
            throw ApiError.forbidden();
        });

        const res = await app.request('/test-api-error', {
            headers: { 'x-request-id': requestId },
        });

        expect(res.status).toBe(403);

        const body = await res.json();

        expect(body.error.code).toBe('auth.forbidden');
        expect(body.requestId).toBe(requestId);
    });

    it('keeps app wiring metadata aligned with runtime registries', () => {
        for (const middlewareName of API_APP_WIRING.rootMiddleware) {
            expect(rootMiddlewareFactories[middlewareName]).toEqual(expect.any(Function));
        }

        expect(errorHandlerFactories[API_APP_WIRING.errorHandler]).toEqual(expect.any(Function));

        for (const middlewareName of API_APP_WIRING.domainWrapper.middleware) {
            expect(domainMiddlewareFactories[middlewareName]).toEqual(expect.any(Function));
        }
    });

    it('keeps contract route wiring metadata aligned with runtime routes', () => {
        const expectedRoutes = [];

        for (const mount of API_ROUTE_MOUNTS) {
            const routeFactory = routeFactories[mount.domain];

            expect(routeFactory).toEqual(expect.any(Function));

            const routes = routeFactory().routes as { method: string; path: string }[];

            expectedRoutes.push(
                ...routes
                    .filter((route) => route.method !== 'ALL')
                    .map((route) => ({
                        method: route.method,
                        path: joinPath(mount.path, route.path),
                    })),
            );
        }

        const actualRoutes = createTestApp()
            .routes.filter((route) => route.method !== 'ALL' && !route.path.startsWith('/docs'))
            .map((route) => ({
                method: route.method,
                path: route.path,
            }));

        expect(actualRoutes).toEqual(expectedRoutes);
    });

    it.each([
        ['/docs'],
        ['/docs/openapi.json'],
        ['/docs/internal'],
        ['/docs/internal/openapi.json'],
    ] as const)('returns 404 for legacy or internal docs path %s', async (path) => {
        const app = createTestApp();
        const res = await app.request(path);

        expect(res.status).toBe(404);
    });

    describe('public OpenAPI servers URL', () => {
        const testPort = 3002;

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('serves the public OpenAPI spec at GET /docs/public/openapi.json without auth', async () => {
            vi.spyOn(serverConfig, 'getServerEnv').mockReturnValue({
                PORT: testPort,
            } as serverConfig.ServerEnv);

            const app = createTestApp();
            const res = await app.request('/docs/public/openapi.json');

            expect(res.status).toBe(200);

            const body = await res.json();
            const publicSpec = JSON.parse(await readFile(join(docsDir, 'public.openapi.json'), 'utf8'));

            expect(body).toEqual({
                ...publicSpec,
                servers: [{ url: `http://localhost:${testPort}` }],
            });
        });

        it('uses API_GATEWAY_DOMAIN when set', async () => {
            vi.spyOn(serverConfig, 'getServerEnv').mockReturnValue({
                PORT: testPort,
                API_GATEWAY_DOMAIN: 'https://api.example.com',
            } as serverConfig.ServerEnv);

            const app = createTestApp();
            const res = await app.request('/docs/public/openapi.json');

            expect(res.status).toBe(200);

            const body = await res.json();

            expect(body.servers).toEqual([{ url: 'https://api.example.com' }]);
        });
    });

    it('serves Swagger UI at GET /docs/public without auth', async () => {
        const app = createTestApp();
        const res = await app.request('/docs/public');

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
    });
});
