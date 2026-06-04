import { Button, CheckIcon, CircleIcon, FilePlusIcon, Progress, Skeleton, cn } from '@aida/ui';

import { PanelBody, PanelFooter } from '../../panelLayout';
import type { TaskItem } from '../types/context.types';

type ContextTasksTabProps = {
    tasks: TaskItem[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function ContextTasksTab({
    tasks,
    isLoading = false,
    isError = false,
    errorMessage,
}: ContextTasksTabProps) {
    return (
        <>
            <PanelBody scrollable className="space-y-3 px-5 py-4">
                {isLoading && (
                    <>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Skeleton className="size-5 rounded-full" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </div>
                            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Skeleton className="size-5 rounded-full" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </div>
                            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Skeleton className="size-5 rounded-full" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </div>
                            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                        </div>
                    </>
                )}

                {!isLoading && isError && (
                    <p className="m-0 text-sm text-destructive">
                        {errorMessage ?? 'We could not load tasks.'}
                    </p>
                )}

                {!isLoading && !isError && tasks.length === 0 && (
                    <p className="m-0 text-sm text-muted-foreground">No tasks yet.</p>
                )}

                {!isLoading &&
                    !isError &&
                    tasks.map((task) => {
                        const isActive = task.status === 'in_progress';

                        return (
                            <article
                                key={task.id}
                                className={cn(
                                    'rounded-xl border border-border bg-card p-4 shadow-sm',
                                    isActive && 'border-l-4 border-l-primary',
                                )}
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 text-sm font-semibold text-foreground">{task.title}</p>
                                        <p className="m-0 mt-1 text-xs text-muted-foreground">Due: {task.dueLabel}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        {isActive ? (
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <CheckIcon className="size-3" strokeWidth={2.5} />
                                            </span>
                                        ) : (
                                            <CircleIcon className="size-5 shrink-0 text-border" />
                                        )}
                                        <span
                                            className={cn(
                                                'text-sm font-semibold',
                                                isActive ? 'text-primary' : 'text-muted-foreground',
                                            )}
                                        >
                                            {task.progress}%
                                        </span>
                                    </div>
                                </div>
                                <Progress
                                    value={task.progress}
                                    className="mt-3 h-1.5 bg-muted"
                                    aria-label={`${task.title} progress`}
                                />
                            </article>
                        );
                    })}
            </PanelBody>
            <PanelFooter>
                <Button type="button" className="w-full">
                    <FilePlusIcon className="mr-2 size-4" />
                    Add task
                </Button>
            </PanelFooter>
        </>
    );
}
