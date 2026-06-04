'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { projectJobsQueryKey } from '@/constants/queryKeys';
import { useMeContext } from '@/hooks/me';
import { ProjectService } from '@/services/project.service';

export function useProjectJobs(projectId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: projectJobsQueryKey(projectId),
        queryFn: () => ProjectService.listJobs(projectId),
        enabled: Boolean(projectId) && meContext.isSuccess,
    });

    const jobs = useMemo(() => {
        if (!query.data) {
            return [];
        }

        if (!meContext.scoped?.isExternalUser) {
            return query.data;
        }

        const scopedIds = new Set(meContext.scoped.jobs.map((job) => job.id));
        return query.data.filter((job) => scopedIds.has(job.id));
    }, [meContext.scoped, query.data]);

    return {
        ...query,
        jobs,
    };
}
