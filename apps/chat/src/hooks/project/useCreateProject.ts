'use client';

import type { ProjectsRow } from '@aida/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meContextQueryKey, orgProjectsQueryKey } from '@/constants/queryKeys';
import { ProjectService, type CreateProjectInput } from '@/services/project.service';

type UseCreateProjectOptions = {
    onSuccess?: (project: ProjectsRow, variables: CreateProjectInput) => void;
};

export function useCreateProject(options?: UseCreateProjectOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (values: CreateProjectInput) =>
            ProjectService.create({
                orgId: values.orgId,
                name: values.name,
                key: values.key,
                description: values.description?.trim() || undefined,
            }),
        onSuccess: async (project, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: meContextQueryKey }),
                queryClient.invalidateQueries({ queryKey: orgProjectsQueryKey(variables.orgId) }),
            ]);
            options?.onSuccess?.(project, variables);
        },
    });
}
