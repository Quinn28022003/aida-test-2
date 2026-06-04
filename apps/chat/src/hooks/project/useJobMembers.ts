'use client';

import { useQuery } from '@tanstack/react-query';

import { projectJobMembersQueryKey } from '@/constants/queryKeys';
import { ProjectService } from '@/services/project.service';

type UseJobMembersOptions = {
    projectId: string;
    jobId: string | undefined;
    enabled?: boolean;
};

export function useJobMembers({ projectId, jobId, enabled = true }: UseJobMembersOptions) {
    return useQuery({
        queryKey: projectJobMembersQueryKey(projectId, jobId ?? ''),
        queryFn: () => ProjectService.listJobMembers(projectId, jobId!),
        enabled: enabled && Boolean(projectId) && Boolean(jobId),
    });
}
