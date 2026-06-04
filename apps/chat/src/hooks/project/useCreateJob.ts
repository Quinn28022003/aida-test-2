'use client';

import type { JobsRow } from '@aida/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meContextQueryKey, projectJobsQueryKey } from '@/constants/queryKeys';
import { ProjectService, type CreateJobInput } from '@/services/project.service';

type UseCreateJobOptions = {
    onSuccess?: (job: JobsRow, variables: CreateJobInput) => void;
};

export function useCreateJob(options?: UseCreateJobOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (values: CreateJobInput) => ProjectService.createJob(values),
        onSuccess: async (job, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: projectJobsQueryKey(variables.projectId) }),
                queryClient.invalidateQueries({ queryKey: meContextQueryKey }),
            ]);
            options?.onSuccess?.(job, variables);
        },
    });
}
