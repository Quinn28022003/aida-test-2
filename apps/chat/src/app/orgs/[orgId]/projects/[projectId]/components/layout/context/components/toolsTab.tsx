import {
    Button,
    CalculatorIcon,
    ChevronRightIcon,
    FilePlusIcon,
    FileTextIcon,
    Skeleton,
    ZapIcon,
    cn,
} from '@aida/ui';

import { PanelBody, PanelFooter } from '../../panelLayout';
import type { ToolItem } from '../types/context.types';

type ToolTone = ToolItem['tone'];

type ContextToolsTabProps = {
    tools: ToolItem[];
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function ContextToolsTab({
    tools,
    isLoading = false,
    isError = false,
    errorMessage,
}: ContextToolsTabProps) {
    return (
        <>
            <PanelBody scrollable className="space-y-3 px-5 py-4">
                {isLoading && (
                    <>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start gap-3">
                                <Skeleton className="size-10 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="size-4 shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start gap-3">
                                <Skeleton className="size-10 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="size-4 shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex min-w-0 items-start gap-3">
                                <Skeleton className="size-10 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="size-4 shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!isLoading && isError && (
                    <p className="m-0 text-sm text-destructive">
                        {errorMessage ?? 'We could not load tools.'}
                    </p>
                )}

                {!isLoading && !isError && tools.length === 0 && (
                    <p className="m-0 text-sm text-muted-foreground">No tools yet.</p>
                )}

                {!isLoading &&
                    !isError &&
                    tools.map((tool) => {
                        const toolToneStyles: Record<ToolTone, { tile: string; icon: typeof FileTextIcon }> = {
                            blue: { tile: 'bg-blue-50 text-blue-600', icon: FileTextIcon },
                            green: { tile: 'bg-emerald-50 text-emerald-600', icon: CalculatorIcon },
                            purple: { tile: 'bg-purple-50 text-purple-600', icon: ZapIcon },
                        };
                        const { tile, icon: Icon } = toolToneStyles[tool.tone];

                        return (
                            <button
                                key={tool.id}
                                type="button"
                                className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/30"
                            >
                                <div className="flex min-w-0 items-start gap-3">
                                    <span
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                            tile,
                                        )}
                                    >
                                        <Icon className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center justify-between gap-2">
                                            <p className="m-0 text-sm font-semibold text-foreground">{tool.title}</p>
                                            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                                        </div>
                                        <p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {tool.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
            </PanelBody>
            <PanelFooter>
                <Button type="button" className="w-full">
                    <FilePlusIcon className="mr-2 size-4" />
                    Add tool
                </Button>
            </PanelFooter>
        </>
    );
}
