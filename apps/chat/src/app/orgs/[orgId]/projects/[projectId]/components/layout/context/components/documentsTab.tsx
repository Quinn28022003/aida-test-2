import { BookOpenIcon, Button, FilePlusIcon, FileTextIcon, Skeleton, cn } from '@aida/ui';

import { PanelBody, PanelFooter } from '../../panelLayout';
import type { DocumentItem } from '../types/context.types';

type ContextDocumentsTabProps = {
    clientDocuments: DocumentItem[];
    knowledgeHubs: DocumentItem[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function ContextDocumentsTab({
    clientDocuments,
    knowledgeHubs,
    isLoading = false,
    isError = false,
    errorMessage,
}: ContextDocumentsTabProps) {
    return (
        <>
            <PanelBody scrollable className="space-y-6 px-5 py-4">
                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Client documents
                        </p>
                        <button type="button" className="text-sm font-semibold text-primary">
                            View all
                        </button>
                    </div>
                    <div className="space-y-3">
                        {isLoading && (
                            <>
                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            </>
                        )}

                        {!isLoading && isError && (
                            <p className="m-0 text-sm text-destructive">
                                {errorMessage ?? 'We could not load documents.'}
                            </p>
                        )}

                        {!isLoading && !isError && clientDocuments.length === 0 && (
                            <p className="m-0 text-sm text-muted-foreground">No client documents yet.</p>
                        )}

                        {!isLoading &&
                            !isError &&
                            clientDocuments.map((item) => (
                                <article
                                    key={item.id}
                                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                                >
                                    <span
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                            'bg-red-50 text-red-600',
                                        )}
                                    >
                                        <FileTextIcon className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 truncate text-sm font-semibold text-foreground">
                                            {item.title}
                                        </p>
                                        <p className="m-0 mt-1 text-xs text-muted-foreground">{item.metadata}</p>
                                    </div>
                                </article>
                            ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Knowledge hubs
                        </p>
                        <button type="button" className="text-sm font-semibold text-primary">
                            View all
                        </button>
                    </div>
                    <div className="space-y-3">
                        {isLoading && (
                            <>
                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            </>
                        )}

                        {!isLoading && isError && (
                            <p className="m-0 text-sm text-destructive">
                                {errorMessage ?? 'We could not load documents.'}
                            </p>
                        )}

                        {!isLoading && !isError && knowledgeHubs.length === 0 && (
                            <p className="m-0 text-sm text-muted-foreground">No knowledge hubs yet.</p>
                        )}

                        {!isLoading &&
                            !isError &&
                            knowledgeHubs.map((item) => (
                                <article
                                    key={item.id}
                                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                                >
                                    <span
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                            'bg-emerald-50 text-emerald-600',
                                        )}
                                    >
                                        <BookOpenIcon className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 truncate text-sm font-semibold text-foreground">
                                            {item.title}
                                        </p>
                                        <p className="m-0 mt-1 text-xs text-muted-foreground">{item.metadata}</p>
                                    </div>
                                </article>
                            ))}
                    </div>
                </section>
            </PanelBody>
            <PanelFooter>
                <Button type="button" className="w-full">
                    <FilePlusIcon className="mr-2 size-4" />
                    Add document
                </Button>
            </PanelFooter>
        </>
    );
}
