import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { meContextQueryKey, orgProjectsQueryKey, projectJobsQueryKey } from '@/constants/queryKeys';
import { useMeContext } from '@/hooks/me';
import { ProjectService } from '@/services/project.service';
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils';
import { useCreateJob } from './useCreateJob';
import { useCreateProject } from './useCreateProject';
import { useJobMembers } from './useJobMembers';
import { useProjectJobs } from './useProjectJobs';

vi.mock('@/hooks/me', () => ({
    useMeContext: vi.fn(),
}));

vi.mock('@/services/project.service', () => ({
    ProjectService: {
        create: vi.fn(),
        createJob: vi.fn(),
        listJobMembers: vi.fn(),
        listJobs: vi.fn(),
    },
}));

const orgId = '00000000-0000-4000-8000-000000000001';
const projectId = '00000000-0000-4000-8000-000000000002';
const visibleJobId = '00000000-0000-4000-8000-000000000003';
const hiddenJobId = '00000000-0000-4000-8000-000000000004';

describe('project hooks', () => {
    beforeEach(() => {
        vi.mocked(ProjectService.create).mockReset();
        vi.mocked(ProjectService.createJob).mockReset();
        vi.mocked(ProjectService.listJobMembers).mockReset();
        vi.mocked(ProjectService.listJobs).mockReset();
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: true,
            scoped: {
                isExternalUser: false,
                organizations: [],
                projects: [],
                jobs: [],
                canManageBilling: true,
            },
        } as ReturnType<typeof useMeContext>);
    });

    it('trims empty project descriptions, invalidates affected queries, and calls onSuccess', async () => {
        vi.mocked(ProjectService.create).mockResolvedValue({
            id: projectId,
            orgId,
            name: 'Kitchen',
            key: 'KITCHEN',
        } as Awaited<ReturnType<typeof ProjectService.create>>);
        const queryClient = createTestQueryClient();
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useCreateProject({ onSuccess }), {
            wrapper: createQueryWrapper(queryClient),
        });

        await act(async () => {
            await result.current.mutateAsync({
                orgId,
                name: 'Kitchen',
                key: 'KITCHEN',
                description: '   ',
            });
        });

        expect(ProjectService.create).toHaveBeenCalledWith({
            orgId,
            name: 'Kitchen',
            key: 'KITCHEN',
            description: undefined,
        });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: meContextQueryKey });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: orgProjectsQueryKey(orgId) });
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: projectId }), expect.any(Object));
    });

    it('invalidates project jobs and me context after creating a job', async () => {
        vi.mocked(ProjectService.createJob).mockResolvedValue({
            id: visibleJobId,
            projectId,
            title: 'Client',
        } as Awaited<ReturnType<typeof ProjectService.createJob>>);
        const queryClient = createTestQueryClient();
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useCreateJob({ onSuccess }), {
            wrapper: createQueryWrapper(queryClient),
        });

        await act(async () => {
            await result.current.mutateAsync({
                projectId,
                title: 'Client',
                customerProfileId: '00000000-0000-4000-8000-000000000005',
            });
        });

        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: projectJobsQueryKey(projectId) });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: meContextQueryKey });
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: visibleJobId }), expect.any(Object));
    });

    it('filters project jobs for external users', async () => {
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: true,
            scoped: {
                isExternalUser: true,
                organizations: [],
                projects: [],
                jobs: [{ id: visibleJobId }],
                canManageBilling: false,
            },
        } as ReturnType<typeof useMeContext>);
        vi.mocked(ProjectService.listJobs).mockResolvedValue([
            { id: visibleJobId, title: 'Visible' },
            { id: hiddenJobId, title: 'Hidden' },
        ] as Awaited<ReturnType<typeof ProjectService.listJobs>>);

        const { result } = renderHook(() => useProjectJobs(projectId), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => expect(result.current.jobs.map((job) => job.id)).toEqual([visibleJobId]));
    });

    it('returns an empty project jobs fallback before data is loaded', () => {
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: false,
            scoped: null,
        } as ReturnType<typeof useMeContext>);

        const { result } = renderHook(() => useProjectJobs(projectId), {
            wrapper: createQueryWrapper(),
        });

        expect(result.current.jobs).toEqual([]);
        expect(ProjectService.listJobs).not.toHaveBeenCalled();
    });

    it('does not fetch job members when job id is missing', async () => {
        const { result } = renderHook(() => useJobMembers({ projectId, jobId: undefined }), {
            wrapper: createQueryWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        await waitFor(() => expect(ProjectService.listJobMembers).not.toHaveBeenCalled());
    });
});
