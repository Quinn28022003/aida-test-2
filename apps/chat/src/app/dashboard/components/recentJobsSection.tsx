'use client';

import type { JobsRow } from '@aida/db';
import { Card, CardContent, MoreVerticalIcon, Skeleton } from '@aida/ui';
import { formatDistanceToNowStrict } from 'date-fns';

type RecentJobsSectionProps = {
    jobs: JobsRow[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function RecentJobsSection({
    jobs,
    isLoading = false,
    isError = false,
    errorMessage,
}: RecentJobsSectionProps) {
    return (
        <section>
            <h3 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">Recent jobs</h3>
            {isLoading && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-44 rounded-2xl" />
                    <Skeleton className="h-44 rounded-2xl" />
                    <Skeleton className="h-44 rounded-2xl" />
                </div>
            )}

            {!isLoading && isError && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0 text-destructive">
                            {errorMessage ?? 'We could not load recent jobs.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && jobs.length === 0 && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0">No recent jobs yet.</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && jobs.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    {jobs.map((job) => (
                        <Card key={job.id} className="rounded-2xl border-0 bg-card shadow-sm">
                            <CardContent className="flex h-full flex-col p-5">
                                <div className="mb-4 flex items-start justify-between gap-2">
                                    <p className="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                        Client
                                    </p>
                                    <button
                                        type="button"
                                        className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                        aria-label={`Actions for ${job.title}`}
                                    >
                                        <MoreVerticalIcon />
                                    </button>
                                </div>
                                <p className="m-0 text-lg font-semibold leading-tight text-foreground">{job.title}</p>
                                <p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)} job in progress.
                                </p>
                                <p className="m-0 mt-auto pt-6 text-sm text-muted-foreground">
                                    {formatDistanceToNowStrict(new Date(job.createdAt), { addSuffix: true })}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}
