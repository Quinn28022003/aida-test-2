import { API_PATHS } from '@aida/contracts';
import { ApiError } from '@aida/api-client/http';
import { JobNotFoundError } from '@aida/projects';
import { createMiddleware } from 'hono/factory';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app/create-app';
import * as projectsCompositionModule from '../composition/projects';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';

const authUserId = '00000000-0000-4000-8000-000000000001';
const orgId = '00000000-0000-4000-8000-000000000002';
const projectId = '00000000-0000-4000-8000-000000000003';
const jobId = '00000000-0000-4000-8000-000000000004';
const profileId = '00000000-0000-4000-8000-000000000005';

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

function createProjectsTestApp(context: AidaSupabaseContext = createMockSupabaseContext()) {
    const authMiddleware = createMiddleware(async (c, next) => {
        c.set('supabaseContext', context);

        if (!c.get('supabaseContext')?.userClaims?.id) {
            throw ApiError.unauthenticated();
        }

        await next();
    });

    return createApp({ authMiddleware, corsAllowedOrigins: [] });
}

describe('GET /projects/:projectId/jobs/:jobId/members', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('calls listJobMembers with the authenticated actor id', async () => {
        const listJobMembers = vi.fn().mockResolvedValue([
            {
                id: '00000000-0000-4000-8000-000000000006',
                orgId,
                projectId,
                jobId,
                userId: profileId,
                memberKind: 'internal',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ]);
        vi.spyOn(projectsCompositionModule, 'createProjectUseCases').mockReturnValue({
            listJobMembers,
        } as never);

        const app = createProjectsTestApp();
        const res = await app.request(API_PATHS.projects.jobMembers(projectId, jobId));

        expect(res.status).toBe(200);
        expect(listJobMembers).toHaveBeenCalledWith({ projectId, jobId, actorAuthUserId: authUserId });

        const body = await res.json();
        expect(body.data).toEqual([expect.objectContaining({ jobId, userId: profileId })]);
    });

    it('maps domain errors from listJobMembers', async () => {
        vi.spyOn(projectsCompositionModule, 'createProjectUseCases').mockReturnValue({
            listJobMembers: vi.fn().mockRejectedValue(new JobNotFoundError(jobId)),
        } as never);

        const app = createProjectsTestApp();
        const res = await app.request(API_PATHS.projects.jobMembers(projectId, jobId));

        expect(res.status).toBe(404);

        const body = await res.json();
        expect(body).toEqual({
            success: false,
            error: expect.objectContaining({
                message: 'Job not found',
            }),
            requestId: expect.any(String),
        });
    });
});
