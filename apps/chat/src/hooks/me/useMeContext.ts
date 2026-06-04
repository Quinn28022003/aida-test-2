'use client';

import type { JobsRow, OrganizationsRow, ProjectsRow } from '@aida/db';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { meContextQueryKey } from '@/constants/queryKeys';
import { useAuth } from '@/lib/auth/session';
import type { MeContext } from '@/services/types/chatApi.types';
import { UserService } from '@/services/user.service';

export type ScopedAccess = {
    isExternalUser: boolean;
    organizations: OrganizationsRow[];
    projects: ProjectsRow[];
    jobs: JobsRow[];
    canManageBilling: boolean;
};

function toIdSet(values: Array<string>) {
    return new Set(values);
}

function deriveScopedAccess(meContext: MeContext): ScopedAccess {
    const membershipOrgIds = toIdSet(meContext.memberships.organizations.map((membership) => membership.orgId));
    const membershipProjectIds = toIdSet(meContext.memberships.projects.map((membership) => membership.projectId));
    const membershipJobIds = toIdSet(meContext.memberships.jobs.map((membership) => membership.jobId));

    const isExternalUser = meContext.memberships.organizations.some(
        (membership) => membership.memberType !== 'internal',
    );

    if (!isExternalUser) {
        return {
            isExternalUser: false,
            organizations: meContext.organizations,
            projects: meContext.projects,
            jobs: meContext.jobs,
            canManageBilling: true,
        };
    }

    return {
        isExternalUser: true,
        organizations: meContext.organizations.filter((organization) => membershipOrgIds.has(organization.id)),
        projects: meContext.projects.filter((project) => membershipProjectIds.has(project.id)),
        jobs: meContext.jobs.filter((job) => membershipJobIds.has(job.id)),
        canManageBilling: false,
    };
}

export function useMeContext() {
    const auth = useAuth();
    const query = useQuery({
        queryKey: meContextQueryKey,
        queryFn: () => UserService.getMeContext(),
        enabled: auth.status === 'authenticated',
    });

    const scoped = useMemo(
        () => (query.data ? deriveScopedAccess(query.data) : null),
        [query.data],
    );

    return {
        ...query,
        scoped,
    };
}
