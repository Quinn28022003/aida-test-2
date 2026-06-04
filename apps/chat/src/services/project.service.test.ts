import {
    getProjectsByProjectIdAgents,
    getProjectsByProjectIdJobs,
    getProjectsByProjectIdJobsByJobIdMembers,
    getProjectsByProjectIdMembers,
    postOrgsByOrgIdProjects,
    postProjectsByProjectIdJobs,
    type ApiClient,
} from '@aida/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectService } from './project.service';

vi.mock('@aida/api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/api-client')>();

    return {
        ...actual,
        getProjectsByProjectIdAgents: vi.fn(),
        getProjectsByProjectIdJobs: vi.fn(),
        getProjectsByProjectIdJobsByJobIdMembers: vi.fn(),
        getProjectsByProjectIdMembers: vi.fn(),
        postOrgsByOrgIdProjects: vi.fn(),
        postProjectsByProjectIdJobs: vi.fn(),
    };
});

const requestId = '00000000-0000-4000-8000-000000000099';
const orgId = '00000000-0000-4000-8000-000000000001';
const projectId = '00000000-0000-4000-8000-000000000002';
const jobId = '00000000-0000-4000-8000-000000000003';
const profileId = '00000000-0000-4000-8000-000000000004';
const api = {} as ApiClient;

function okResponse(data: unknown) {
    return {
        data,
        error: undefined,
        response: new Response(null, { status: 200 }),
    };
}

function createdResponse(data: unknown) {
    return {
        data,
        error: undefined,
        response: new Response(null, { status: 201 }),
    };
}

function failureResponse(message: string, reason?: string) {
    return {
        data: undefined,
        error: {
            success: false,
            error: {
                code: 'request.invalid',
                message,
                details: reason ? { reason } : undefined,
            },
            requestId,
        },
        response: new Response(null, { status: 400 }),
    };
}

function projectRow() {
    return {
        id: projectId,
        orgId,
        name: 'Kitchen',
        key: 'KITCHEN',
        description: null,
        status: 'active',
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function jobRow() {
    return {
        id: jobId,
        orgId,
        projectId,
        title: 'Client job',
        status: 'open',
        customerProfileId: profileId,
        externalRef: null,
        metadata: {},
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function projectMemberRow() {
    return {
        id: '00000000-0000-4000-8000-000000000005',
        orgId,
        projectId,
        userId: profileId,
        projectRole: 'member',
        invitedBy: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function jobMemberRow() {
    return {
        id: '00000000-0000-4000-8000-000000000006',
        orgId,
        projectId,
        jobId,
        userId: profileId,
        memberKind: 'internal',
        invitedBy: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function agentRow() {
    return {
        id: '00000000-0000-4000-8000-000000000007',
        orgId,
        activeVersionId: null,
        createdBy: profileId,
        description: null,
        key: 'tax_assistant',
        name: 'Tax Assistant',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function projectAgentRow() {
    return {
        id: '00000000-0000-4000-8000-000000000008',
        orgId,
        projectId,
        agentId: agentRow().id,
        visibility: 'restricted',
        createdAt: '2026-01-01T00:00:00.000Z',
    };
}

describe('ProjectService', () => {
    beforeEach(() => {
        vi.mocked(postOrgsByOrgIdProjects).mockReset();
        vi.mocked(postProjectsByProjectIdJobs).mockReset();
        vi.mocked(getProjectsByProjectIdAgents).mockReset();
        vi.mocked(getProjectsByProjectIdJobs).mockReset();
        vi.mocked(getProjectsByProjectIdMembers).mockReset();
        vi.mocked(getProjectsByProjectIdJobsByJobIdMembers).mockReset();
    });

    it('creates a project and parses the success envelope', async () => {
        vi.mocked(postOrgsByOrgIdProjects).mockResolvedValue(
            createdResponse({ success: true, data: projectRow(), requestId }) as Awaited<
                ReturnType<typeof postOrgsByOrgIdProjects>
            >,
        );

        await expect(
            ProjectService.create({ orgId, name: 'Kitchen', key: 'KITCHEN', description: 'Renovation' }, api),
        ).resolves.toEqual(expect.objectContaining({ id: projectId }));
        expect(postOrgsByOrgIdProjects).toHaveBeenCalledWith({
            client: api,
            path: { orgId },
            body: { name: 'Kitchen', key: 'KITCHEN', description: 'Renovation' },
        });
    });

    it('throws API envelope messages when project creation fails', async () => {
        vi.mocked(postOrgsByOrgIdProjects).mockResolvedValue(
            failureResponse('Could not create the project.', 'duplicate key') as Awaited<
                ReturnType<typeof postOrgsByOrgIdProjects>
            >,
        );

        await expect(ProjectService.create({ orgId, name: 'Kitchen', key: 'KITCHEN' }, api)).rejects.toThrow(
            'Could not create the project.: duplicate key',
        );
    });

    it('creates a job and parses the success envelope', async () => {
        vi.mocked(postProjectsByProjectIdJobs).mockResolvedValue(
            createdResponse({ success: true, data: jobRow(), requestId }) as Awaited<
                ReturnType<typeof postProjectsByProjectIdJobs>
            >,
        );

        await expect(
            ProjectService.createJob({ projectId, title: 'Client job', customerProfileId: profileId }, api),
        ).resolves.toEqual(expect.objectContaining({ id: jobId }));
    });

    it('throws API envelope messages when job creation fails', async () => {
        vi.mocked(postProjectsByProjectIdJobs).mockResolvedValue(
            failureResponse('Could not create the job ticket.') as Awaited<
                ReturnType<typeof postProjectsByProjectIdJobs>
            >,
        );

        await expect(
            ProjectService.createJob({ projectId, title: 'Client job', customerProfileId: profileId }, api),
        ).rejects.toThrow('Could not create the job ticket.');
    });

    it('lists jobs and parses the success envelope', async () => {
        vi.mocked(getProjectsByProjectIdJobs).mockResolvedValue(
            okResponse({ success: true, data: [jobRow()], requestId }) as Awaited<
                ReturnType<typeof getProjectsByProjectIdJobs>
            >,
        );

        await expect(ProjectService.listJobs(projectId, api)).resolves.toEqual([
            expect.objectContaining({ id: jobId }),
        ]);
    });

    it('throws API envelope messages when listing jobs fails', async () => {
        vi.mocked(getProjectsByProjectIdJobs).mockResolvedValue(
            failureResponse('Could not load jobs for this project.') as Awaited<
                ReturnType<typeof getProjectsByProjectIdJobs>
            >,
        );

        await expect(ProjectService.listJobs(projectId, api)).rejects.toThrow(
            'Could not load jobs for this project.',
        );
    });

    it('lists project members and parses the success envelope', async () => {
        vi.mocked(getProjectsByProjectIdMembers).mockResolvedValue(
            okResponse({ success: true, data: [projectMemberRow()], requestId }) as Awaited<
                ReturnType<typeof getProjectsByProjectIdMembers>
            >,
        );

        await expect(ProjectService.listMembers(projectId, api)).resolves.toEqual([
            expect.objectContaining({ userId: profileId }),
        ]);
    });

    it('throws API envelope messages when listing project members fails', async () => {
        vi.mocked(getProjectsByProjectIdMembers).mockResolvedValue(
            failureResponse('Could not load project members.') as Awaited<
                ReturnType<typeof getProjectsByProjectIdMembers>
            >,
        );

        await expect(ProjectService.listMembers(projectId, api)).rejects.toThrow('Could not load project members.');
    });

    it('lists project agents and parses the success envelope', async () => {
        vi.mocked(getProjectsByProjectIdAgents).mockResolvedValue(
            okResponse({
                success: true,
                data: [{ projectAgent: projectAgentRow(), agent: agentRow(), activeVersion: null }],
                requestId,
            }) as Awaited<ReturnType<typeof getProjectsByProjectIdAgents>>,
        );

        await expect(ProjectService.listAgents(projectId, api)).resolves.toEqual([
            expect.objectContaining({
                agent: expect.objectContaining({ id: agentRow().id }),
                projectAgent: expect.objectContaining({ projectId }),
            }),
        ]);
    });

    it('throws API envelope messages when listing project agents fails', async () => {
        vi.mocked(getProjectsByProjectIdAgents).mockResolvedValue(
            failureResponse('Could not load project agents.') as Awaited<
                ReturnType<typeof getProjectsByProjectIdAgents>
            >,
        );

        await expect(ProjectService.listAgents(projectId, api)).rejects.toThrow('Could not load project agents.');
    });

    it('lists job members and parses the success envelope', async () => {
        vi.mocked(getProjectsByProjectIdJobsByJobIdMembers).mockResolvedValue(
            okResponse({ success: true, data: [jobMemberRow()], requestId }) as Awaited<
                ReturnType<typeof getProjectsByProjectIdJobsByJobIdMembers>
            >,
        );

        await expect(ProjectService.listJobMembers(projectId, jobId, api)).resolves.toEqual([
            expect.objectContaining({ jobId }),
        ]);
    });

    it('throws API envelope messages when listing job members fails', async () => {
        vi.mocked(getProjectsByProjectIdJobsByJobIdMembers).mockResolvedValue(
            failureResponse('Could not load job members.') as Awaited<
                ReturnType<typeof getProjectsByProjectIdJobsByJobIdMembers>
            >,
        );

        await expect(ProjectService.listJobMembers(projectId, jobId, api)).rejects.toThrow(
            'Could not load job members.',
        );
    });

    it('returns an empty result without creating a conversation over HTTP', async () => {
        await expect(
            ProjectService.createConversation({
                orgId,
                projectId,
                jobId,
                title: 'New conversation',
            }),
        ).resolves.toEqual({});
    });
});
