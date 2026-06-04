import type { ProjectsRow } from '@aida/db';
import { Badge, Button, Card, CardContent, Skeleton } from '@aida/ui';
import Link from 'next/link';

import { ROUTE_PATHS } from '@/constants/routePaths';

import type { OrgDetail } from '../lib/orgDetail';

type OrgProjectsSectionProps = {
    orgId: string;
    detail: OrgDetail | null;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

function formatProjectStatus(status: ProjectsRow['status']) {
    return status === 'active' ? 'Active' : 'Archived';
}

function ProjectListItem({
    orgId,
    project,
    jobCount,
}: {
    orgId: string;
    project: ProjectsRow;
    jobCount: number;
}) {
    return (
        <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-0 bg-card p-5 shadow-sm">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 text-base font-semibold text-foreground">{project.name}</p>
                    <Badge variant="secondary" className="rounded-full capitalize">
                        {formatProjectStatus(project.status)}
                    </Badge>
                </div>
                <p className="m-0 mt-1 text-sm text-muted-foreground">
                    {project.description ?? 'No description provided.'}
                </p>
                <p className="m-0 mt-2 text-xs text-muted-foreground">
                    {jobCount} {jobCount === 1 ? 'job' : 'jobs'}
                </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
                <Link href={ROUTE_PATHS.ProjectWorkspace(orgId, project.id)}>View project</Link>
            </Button>
        </article>
    );
}

export function OrgProjectsSection({
    orgId,
    detail,
    isLoading = false,
    isError = false,
    errorMessage,
}: OrgProjectsSectionProps) {
    return (
        <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <h2 className="m-0 text-2xl font-semibold tracking-tight text-foreground">Projects</h2>
                {!isLoading && !isError && detail && (
                    <p className="m-0 text-sm text-muted-foreground">
                        {detail.projectCount} {detail.projectCount === 1 ? 'project' : 'projects'}
                    </p>
                )}
            </div>

            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-28 rounded-2xl" />
                    <Skeleton className="h-28 rounded-2xl" />
                </div>
            )}

            {!isLoading && isError && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0 text-destructive">{errorMessage ?? 'We could not load projects.'}</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && detail && detail.projects.length === 0 && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="p-5 text-sm text-muted-foreground">No projects yet.</CardContent>
                </Card>
            )}

            {!isLoading && !isError && detail && detail.projects.length > 0 && (
                <ul className="m-0 list-none space-y-3 p-0">
                    {detail.projects.map((project) => (
                        <li key={project.id}>
                            <ProjectListItem
                                orgId={orgId}
                                project={project}
                                jobCount={detail.jobsByProjectId.get(project.id)?.length ?? 0}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
