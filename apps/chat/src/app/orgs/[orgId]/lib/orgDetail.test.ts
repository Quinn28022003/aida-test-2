import type { JobsRow, OrganizationsRow, ProjectsRow } from '@aida/db';
import { describe, expect, it } from 'vitest';

import type { ScopedAccess } from '@/hooks/me';
import type { MeContext } from '@/services/types/chatApi.types';
import { getOrgDetail } from './orgDetail';

const orgId = '00000000-0000-4000-8000-000000000001';
const otherOrgId = '00000000-0000-4000-8000-000000000099';
const profileId = '00000000-0000-4000-8000-000000000002';
const projectId = '00000000-0000-4000-8000-000000000003';
const secondProjectId = '00000000-0000-4000-8000-000000000004';

function createOrganization(overrides: Partial<OrganizationsRow> = {}): OrganizationsRow {
    return {
        id: orgId,
        name: 'Acme',
        slug: 'acme',
        plan: 'pro',
        dataRegion: 'au',
        defaultLocale: 'en-AU',
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function createProject(overrides: Partial<ProjectsRow> = {}): ProjectsRow {
    return {
        id: projectId,
        orgId,
        name: 'Kitchen Renovation',
        key: 'KITCHEN',
        description: null,
        status: 'active',
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function createJob(overrides: Partial<JobsRow> = {}): JobsRow {
    return {
        id: '00000000-0000-4000-8000-000000000010',
        orgId,
        projectId,
        title: 'Prepare tax return',
        status: 'open',
        customerProfileId: '00000000-0000-4000-8000-000000000020',
        externalRef: null,
        metadata: {},
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function createScopedAccess(overrides: Partial<ScopedAccess> = {}): ScopedAccess {
    return {
        isExternalUser: false,
        organizations: [createOrganization()],
        projects: [createProject()],
        jobs: [createJob()],
        canManageBilling: true,
        ...overrides,
    };
}

function createMemberships(
    organizations: MeContext['memberships']['organizations'] = [
        {
            id: '00000000-0000-4000-8000-000000000030',
            orgId,
            userId: profileId,
            memberType: 'internal',
            status: 'active',
            invitedBy: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
    ],
): MeContext['memberships'] {
    return {
        organizations,
        projects: [],
        jobs: [],
        agents: [],
        conversations: [],
    };
}

describe('getOrgDetail', () => {
    it('returns null when the organisation is not accessible', () => {
        const detail = getOrgDetail(createScopedAccess({ organizations: [] }), createMemberships(), orgId, profileId);

        expect(detail).toBeNull();
    });

    it('calculates counts and owner role for the selected organisation', () => {
        const scoped = createScopedAccess({
            projects: [
                createProject({ id: projectId, status: 'active' }),
                createProject({ id: secondProjectId, status: 'archived' }),
                createProject({ id: '00000000-0000-4000-8000-000000000005', orgId: otherOrgId }),
            ],
            jobs: [
                createJob({ id: '00000000-0000-4000-8000-000000000011', status: 'open' }),
                createJob({ id: '00000000-0000-4000-8000-000000000012', status: 'closed' }),
                createJob({ id: '00000000-0000-4000-8000-000000000013', orgId: otherOrgId }),
            ],
        });
        const memberships = createMemberships([
            {
                id: '00000000-0000-4000-8000-000000000031',
                orgId,
                userId: profileId,
                memberType: 'internal',
                status: 'active',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: '00000000-0000-4000-8000-000000000032',
                orgId,
                userId: '00000000-0000-4000-8000-000000000033',
                memberType: 'external',
                status: 'active',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: '00000000-0000-4000-8000-000000000034',
                orgId: otherOrgId,
                userId: '00000000-0000-4000-8000-000000000035',
                memberType: 'external',
                status: 'active',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ]);

        const detail = getOrgDetail(scoped, memberships, orgId, profileId);

        expect(detail).toEqual(
            expect.objectContaining({
                memberCount: 2,
                role: 'Owner',
                projectCount: 2,
                activeProjectCount: 1,
                jobCount: 2,
                openJobCount: 1,
            }),
        );
    });

    it('returns member role when the profile did not create the organisation', () => {
        const detail = getOrgDetail(
            createScopedAccess({ organizations: [createOrganization({ createdBy: '00000000-0000-4000-8000-000000000050' })] }),
            createMemberships(),
            orgId,
            profileId,
        );

        expect(detail?.role).toBe('Member');
    });

    it('groups jobs by project and sorts each group newest first', () => {
        const olderJob = createJob({
            id: '00000000-0000-4000-8000-000000000041',
            projectId,
            title: 'Older',
            createdAt: '2026-01-01T00:00:00.000Z',
        });
        const newerJob = createJob({
            id: '00000000-0000-4000-8000-000000000042',
            projectId,
            title: 'Newer',
            createdAt: '2026-01-03T00:00:00.000Z',
        });
        const secondProjectJob = createJob({
            id: '00000000-0000-4000-8000-000000000043',
            projectId: secondProjectId,
            title: 'Second project',
            createdAt: '2026-01-02T00:00:00.000Z',
        });

        const detail = getOrgDetail(
            createScopedAccess({ jobs: [olderJob, secondProjectJob, newerJob] }),
            createMemberships(),
            orgId,
            profileId,
        );

        expect(detail?.jobsByProjectId.get(projectId)?.map((job) => job.title)).toEqual(['Newer', 'Older']);
        expect(detail?.jobsByProjectId.get(secondProjectId)?.map((job) => job.title)).toEqual(['Second project']);
    });
});
