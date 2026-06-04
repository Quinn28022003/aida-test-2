import type { MeContext } from '@/services/types/chatApi.types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';
import { UserService } from '@/services/user.service';
import { useMeContext } from './useMeContext';

const useAuthMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
    useAuth: () => useAuthMock(),
}));

vi.mock('@/services/user.service', () => ({
    UserService: {
        getMeContext: vi.fn(),
    },
}));

const orgId = '00000000-0000-4000-8000-000000000001';
const externalOrgId = '00000000-0000-4000-8000-000000000002';
const projectId = '00000000-0000-4000-8000-000000000003';
const externalProjectId = '00000000-0000-4000-8000-000000000004';
const jobId = '00000000-0000-4000-8000-000000000005';
const externalJobId = '00000000-0000-4000-8000-000000000006';
const profileId = '00000000-0000-4000-8000-000000000007';

function createMeContext(memberType: 'internal' | 'external'): MeContext {
    return {
        organizations: [
            {
                id: orgId,
                name: 'Internal Org',
                slug: 'internal-org',
                plan: 'pro',
                dataRegion: 'au',
                defaultLocale: 'en-AU',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: externalOrgId,
                name: 'External Org',
                slug: 'external-org',
                plan: 'pro',
                dataRegion: 'au',
                defaultLocale: 'en-AU',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        projects: [
            {
                id: projectId,
                orgId,
                name: 'Hidden Project',
                key: 'HIDDEN',
                description: null,
                status: 'active',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: externalProjectId,
                orgId: externalOrgId,
                name: 'Visible Project',
                key: 'VISIBLE',
                description: null,
                status: 'active',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        jobs: [
            {
                id: jobId,
                orgId,
                projectId,
                title: 'Hidden Job',
                status: 'open',
                customerProfileId: profileId,
                externalRef: null,
                metadata: {},
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            {
                id: externalJobId,
                orgId: externalOrgId,
                projectId: externalProjectId,
                title: 'Visible Job',
                status: 'open',
                customerProfileId: profileId,
                externalRef: null,
                metadata: {},
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        agents: [],
        conversations: [],
        memberships: {
            organizations: [
                {
                    id: '00000000-0000-4000-8000-000000000020',
                    orgId: externalOrgId,
                    userId: profileId,
                    memberType,
                    status: 'active',
                    invitedBy: null,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            projects: [
                {
                    id: '00000000-0000-4000-8000-000000000021',
                    orgId: externalOrgId,
                    projectId: externalProjectId,
                    userId: profileId,
                    projectRole: 'member',
                    invitedBy: null,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            jobs: [
                {
                    id: '00000000-0000-4000-8000-000000000022',
                    orgId: externalOrgId,
                    projectId: externalProjectId,
                    jobId: externalJobId,
                    userId: profileId,
                    memberKind: 'external',
                    invitedBy: null,
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            agents: [],
            conversations: [],
        },
    };
}

describe('useMeContext', () => {
    beforeEach(() => {
        vi.mocked(UserService.getMeContext).mockReset();
        useAuthMock.mockReset();
    });

    it('fetches me context when authenticated', async () => {
        vi.mocked(UserService.getMeContext).mockResolvedValue(createMeContext('internal'));
        useAuthMock.mockReturnValue({ status: 'authenticated' });

        const { result } = renderHook(() => useMeContext(), { wrapper: createQueryWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(UserService.getMeContext).toHaveBeenCalledTimes(1);
    });

    it('does not fetch when unauthenticated', async () => {
        useAuthMock.mockReturnValue({ status: 'unauthenticated' });

        renderHook(() => useMeContext(), { wrapper: createQueryWrapper() });

        await waitFor(() => expect(UserService.getMeContext).not.toHaveBeenCalled());
    });

    it('returns all access for internal users', async () => {
        vi.mocked(UserService.getMeContext).mockResolvedValue(createMeContext('internal'));
        useAuthMock.mockReturnValue({ status: 'authenticated' });

        const { result } = renderHook(() => useMeContext(), { wrapper: createQueryWrapper() });

        await waitFor(() => expect(result.current.scoped).not.toBeNull());
        expect(result.current.scoped).toEqual(
            expect.objectContaining({
                isExternalUser: false,
                organizations: expect.arrayContaining([expect.objectContaining({ id: orgId })]),
                projects: expect.arrayContaining([expect.objectContaining({ id: projectId })]),
                jobs: expect.arrayContaining([expect.objectContaining({ id: jobId })]),
                canManageBilling: true,
            }),
        );
    });

    it('filters access for external users', async () => {
        vi.mocked(UserService.getMeContext).mockResolvedValue(createMeContext('external'));
        useAuthMock.mockReturnValue({ status: 'authenticated' });

        const { result } = renderHook(() => useMeContext(), { wrapper: createQueryWrapper() });

        await waitFor(() => expect(result.current.scoped).not.toBeNull());
        expect(result.current.scoped?.isExternalUser).toBe(true);
        expect(result.current.scoped?.canManageBilling).toBe(false);
        expect(result.current.scoped?.organizations.map((org) => org.id)).toEqual([externalOrgId]);
        expect(result.current.scoped?.projects.map((project) => project.id)).toEqual([externalProjectId]);
        expect(result.current.scoped?.jobs.map((job) => job.id)).toEqual([externalJobId]);
    });
});
