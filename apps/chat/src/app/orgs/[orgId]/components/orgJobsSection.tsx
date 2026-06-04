import type { JobsRow } from '@aida/db';
import { Card, CardContent, Skeleton } from '@aida/ui';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';

import { ROUTE_PATHS } from '@/constants/routePaths';

import type { OrgDetail } from '../lib/orgDetail';

type OrgJobsSectionProps = {
    orgId: string;
    detail: OrgDetail | null;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

function formatJobStatus(status: JobsRow['status']) {
    if (status === 'open') {
        return 'Open';
    }
    if (status === 'closed') {
        return 'Closed';
    }
    return 'Archived';
}

function getProjectName(detail: OrgDetail, projectId: string) {
    return detail.projects.find((project) => project.id === projectId)?.name ?? 'Unknown project';
}

export function OrgJobsSection({
    orgId,
    detail,
    isLoading = false,
    isError = false,
    errorMessage,
}: OrgJobsSectionProps) {
    const sortedJobs = detail ? [...detail.jobs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) : [];

    return (
        <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <h2 className="m-0 text-2xl font-semibold tracking-tight text-foreground">Jobs</h2>
                {!isLoading && !isError && detail && (
                    <p className="m-0 text-sm text-muted-foreground">
                        {detail.jobCount} {detail.jobCount === 1 ? 'job' : 'jobs'}
                    </p>
                )}
            </div>

            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                </div>
            )}

            {!isLoading && isError && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0 text-destructive">{errorMessage ?? 'We could not load jobs.'}</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && detail && sortedJobs.length === 0 && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="p-5 text-sm text-muted-foreground">No jobs yet.</CardContent>
                </Card>
            )}

            {!isLoading && !isError && detail && sortedJobs.length > 0 && (
                <ul className="m-0 list-none space-y-3 p-0">
                    {sortedJobs.map((job) => (
                        <li key={job.id}>
                            <Link
                                href={ROUTE_PATHS.ProjectWorkspace(orgId, job.projectId, { jobId: job.id })}
                                className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 no-underline shadow-sm transition hover:border-primary/40"
                            >
                                <div className="min-w-0">
                                    <p className="m-0 text-base font-semibold text-foreground">{job.title}</p>
                                    <p className="m-0 mt-1 text-sm text-muted-foreground">
                                        {getProjectName(detail, job.projectId)} · {formatJobStatus(job.status)}
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm text-muted-foreground">
                                    {formatDistanceToNowStrict(new Date(job.createdAt), { addSuffix: true })}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
