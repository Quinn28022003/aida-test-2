import { API_PATHS } from '@aida/contracts';
import { ApiError } from '@aida/api-client/http';
import { createMiddleware } from 'hono/factory';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app/create-app';
import * as agentsCompositionModule from '../composition/agents';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';

const authUserId = 'aa0e8400-e29b-41d4-a716-446655440001';
const projectId = '11111111-1111-4111-8111-111111111111';
const agentId = '22222222-2222-4222-8222-222222222222';
const invitationId = '33333333-3333-4333-8333-333333333333';
const memberUserId = '44444444-4444-4444-8444-444444444444';

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

function createAgentsTestApp(context?: AidaSupabaseContext) {
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

describe('agent principal routes', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns auth.unauthenticated for GET /projects/:projectId/agents without auth', async () => {
        const app = createAgentsTestApp();
        const res = await app.request(API_PATHS.projects.agents(projectId));

        expect(res.status).toBe(401);

        const body = await res.json();

        expect(body.error.code).toBe('auth.unauthenticated');
    });

    it('returns project agent data for authenticated GET /projects/:projectId/agents', async () => {
        const projectAgents = [
            {
                projectAgent: { id: 'link-1', projectId },
                agent: { id: agentId, name: 'Alpha Assistant' },
                activeVersion: { id: 'version-1', version: 1 },
            },
        ];
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            listProjectAgents: vi.fn().mockResolvedValue(projectAgents),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.projects.agents(projectId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.success).toBe(true);
        expect(body.data).toEqual(projectAgents);
    });

    it('returns auth.unauthenticated for GET /agents/:agentId without auth', async () => {
        const app = createAgentsTestApp();
        const res = await app.request(API_PATHS.agents.byId(agentId));

        expect(res.status).toBe(401);

        const body = await res.json();

        expect(body.error.code).toBe('auth.unauthenticated');
    });

    it('returns agent detail for authenticated GET /agents/:agentId', async () => {
        const agentDetail = {
            agent: { id: agentId, name: 'Alpha Assistant' },
            activeVersion: { id: 'version-1', version: 1 },
            projectLinks: [{ id: 'link-1', projectId }],
        };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            getAgent: vi.fn().mockResolvedValue(agentDetail),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.byId(agentId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.success).toBe(true);
        expect(body.data).toEqual(agentDetail);
    });

    it('returns auth.unauthenticated for POST /agents without auth', async () => {
        const app = createAgentsTestApp();
        const res = await app.request(API_PATHS.agents.list, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId,
                key: 'demo-agent',
                name: 'Demo Agent',
                version: { instructions: 'Helpful.', modelName: 'test-model' },
            }),
        });

        expect(res.status).toBe(401);
    });

    it('creates an agent for authenticated POST /agents', async () => {
        const agentDetail = {
            agent: { id: agentId, name: 'Demo Agent' },
            activeVersion: { id: 'version-1', version: 1 },
            projectLinks: [{ id: 'link-1', projectId }],
        };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            createAgent: vi.fn().mockResolvedValue(agentDetail),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.list, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer valid-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId,
                key: 'demo-agent',
                name: 'Demo Agent',
                version: { instructions: 'Helpful.', modelName: 'test-model' },
            }),
        });

        expect(res.status).toBe(201);
        expect((await res.json()).data).toEqual(agentDetail);
    });

    it('updates an agent for authenticated PATCH /agents/:agentId', async () => {
        const agentDetail = {
            agent: { id: agentId, name: 'Updated Agent' },
            activeVersion: null,
            projectLinks: [],
        };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            updateAgent: vi.fn().mockResolvedValue(agentDetail),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.byId(agentId), {
            method: 'PATCH',
            headers: {
                Authorization: 'Bearer valid-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Updated Agent',
                version: { instructions: 'Updated.', modelName: 'test-model' },
            }),
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(agentDetail);
    });

    it('deletes an agent for authenticated DELETE /agents/:agentId', async () => {
        const agentDetail = {
            agent: { id: agentId, name: 'Demo Agent' },
            activeVersion: null,
            projectLinks: [],
        };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            deleteAgent: vi.fn().mockResolvedValue(agentDetail),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.byId(agentId), {
            method: 'DELETE',
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(agentDetail);
    });

    it('returns auth.unauthenticated for GET /agents/:agentId/versions without auth', async () => {
        const app = createAgentsTestApp();
        const res = await app.request(API_PATHS.agents.versions(agentId));

        expect(res.status).toBe(401);
    });

    it('lists agent versions for authenticated GET /agents/:agentId/versions', async () => {
        const versions = [
            { id: 'version-2', agentId, version: 2, status: 'active' },
            { id: 'version-1', agentId, version: 1, status: 'archived' },
        ];
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            listAgentVersions: vi.fn().mockResolvedValue(versions),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.versions(agentId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(versions);
    });

    it('returns auth.unauthenticated for GET /agents/:agentId/members without auth', async () => {
        const app = createAgentsTestApp();
        const res = await app.request(API_PATHS.agents.members(agentId));

        expect(res.status).toBe(401);
    });

    it('lists agent members for authenticated GET /agents/:agentId/members', async () => {
        const members = [{ id: 'member-1', agentId, subjectId: memberUserId }];
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            listAgentMembers: vi.fn().mockResolvedValue(members),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.members(agentId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(members);
    });

    it('adds an agent member for authenticated POST /agents/:agentId/members', async () => {
        const member = { id: 'member-1', agentId, subjectId: memberUserId, access: 'invoker' };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            addAgentMember: vi.fn().mockResolvedValue(member),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.members(agentId), {
            method: 'POST',
            headers: {
                Authorization: 'Bearer valid-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: memberUserId, access: 'invoker' }),
        });

        expect(res.status).toBe(201);
        expect((await res.json()).data).toEqual(member);
    });

    it('revokes an agent member for authenticated DELETE /agents/:agentId/members', async () => {
        const member = { id: 'member-1', agentId, subjectId: memberUserId, revokedAt: '2026-05-01T00:00:00.000Z' };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            revokeAgentMember: vi.fn().mockResolvedValue(member),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.members(agentId), {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer valid-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: memberUserId }),
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(member);
    });

    it('lists agent invitations for authenticated GET /agents/:agentId/invitations', async () => {
        const invitations = [{ id: invitationId, agentId, email: 'user@example.com' }];
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            listAgentInvitations: vi.fn().mockResolvedValue(invitations),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.invitations(agentId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(invitations);
    });

    it('returns an agent invitation for authenticated GET /agents/:agentId/invitations/:invitationId', async () => {
        const invitation = { id: invitationId, agentId, email: 'user@example.com' };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            getAgentInvitation: vi.fn().mockResolvedValue(invitation),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.invitationById(agentId, invitationId), {
            headers: { Authorization: 'Bearer valid-token' },
        });

        expect(res.status).toBe(200);
        expect((await res.json()).data).toEqual(invitation);
    });

    it('creates an agent invitation for authenticated POST /agents/:agentId/invitations', async () => {
        const result = {
            invitation: { id: invitationId, agentId, email: 'user@example.com' },
            token: 'accept-token',
        };
        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue({
            createAgentInvitation: vi.fn().mockResolvedValue(result),
        } as never);

        const app = createAgentsTestApp(createMockSupabaseContext());
        const res = await app.request(API_PATHS.agents.invitations(agentId), {
            method: 'POST',
            headers: {
                Authorization: 'Bearer valid-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'user@example.com', access: 'invoker' }),
        });

        expect(res.status).toBe(201);
        expect((await res.json()).data).toEqual(result);
    });
});
