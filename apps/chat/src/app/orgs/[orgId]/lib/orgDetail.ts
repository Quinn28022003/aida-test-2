import type { JobsRow, OrganizationsRow, ProjectsRow } from '@aida/db';

import type { ScopedAccess } from '@/hooks/me';
import type { MeContext } from '@/services/types/chatApi.types';

export type OrgDetail = {
    organization: OrganizationsRow;
    projects: ProjectsRow[];
    jobs: JobsRow[];
    jobsByProjectId: Map<string, JobsRow[]>;
    memberCount: number;
    role: string;
    projectCount: number;
    activeProjectCount: number;
    jobCount: number;
    openJobCount: number;
};

function groupJobsByProjectId(jobs: JobsRow[]): Map<string, JobsRow[]> {
    const grouped = new Map<string, JobsRow[]>();

    for (const job of jobs) {
        const existing = grouped.get(job.projectId) ?? [];
        existing.push(job);
        grouped.set(job.projectId, existing);
    }

    for (const [projectId, projectJobs] of grouped) {
        grouped.set(
            projectId,
            [...projectJobs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        );
    }

    return grouped;
}

export function getOrgDetail(
    scoped: ScopedAccess,
    memberships: MeContext['memberships'],
    orgId: string,
    profileId: string | undefined,
): OrgDetail | null {
    const organization = scoped.organizations.find((item) => item.id === orgId);
    if (!organization) {
        return null;
    }

    const projects = scoped.projects.filter((project) => project.orgId === orgId);
    const jobs = scoped.jobs.filter((job) => job.orgId === orgId);
    const memberCount = memberships.organizations.filter((membership) => membership.orgId === orgId).length;

    return {
        organization,
        projects,
        jobs,
        jobsByProjectId: groupJobsByProjectId(jobs),
        memberCount,
        role: organization.createdBy === profileId ? 'Owner' : 'Member',
        projectCount: projects.length,
        activeProjectCount: projects.filter((project) => project.status === 'active').length,
        jobCount: jobs.length,
        openJobCount: jobs.filter((job) => job.status === 'open').length,
    };
}
