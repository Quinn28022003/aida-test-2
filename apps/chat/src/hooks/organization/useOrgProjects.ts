'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { orgProjectsQueryKey } from '@/constants/queryKeys';
import { useMeContext } from '@/hooks/me';
import { OrganizationService } from '@/services/organization.service';

export function useOrgProjects(orgId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: orgProjectsQueryKey(orgId),
        queryFn: () => OrganizationService.listProjects(orgId),
        enabled: Boolean(orgId) && meContext.isSuccess,
    });

    const projects = useMemo(() => {
        if (!query.data) {
            return [];
        }

        if (!meContext.scoped?.isExternalUser) {
            return query.data;
        }

        const scopedIds = new Set(meContext.scoped.projects.map((project) => project.id));
        return query.data.filter((project) => scopedIds.has(project.id));
    }, [meContext.scoped, query.data]);

    return {
        ...query,
        projects,
    };
}
