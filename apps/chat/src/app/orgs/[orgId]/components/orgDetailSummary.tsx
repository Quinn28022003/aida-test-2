import type { OrgDetail } from '../lib/orgDetail';
import { Badge, BuildingIcon, Card, CardContent, Skeleton } from '@aida/ui';

type OrgDetailSummaryProps = {
    detail: OrgDetail | null;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function OrgDetailSummary({
    detail,
    isLoading = false,
    isError = false,
    errorMessage,
}: OrgDetailSummaryProps) {
    return (
        <>
            {isLoading && <Skeleton className="h-32 rounded-2xl" />}

            {!isLoading && isError && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0 text-destructive">
                            {errorMessage ?? 'We could not load organisation details.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && !detail && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="p-5 text-sm text-muted-foreground">
                        You do not currently have access to this organisation.
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && detail && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <BuildingIcon className="size-11 shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600" />
                            <div className="min-w-0 flex-1">
                                <p className="m-0 truncate text-2xl font-semibold tracking-tight text-foreground">
                                    {detail.organization.name}
                                </p>
                                <p className="m-0 mt-1 text-sm text-muted-foreground">{detail.role}</p>
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                                        Active
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {detail.memberCount} {detail.memberCount === 1 ? 'member' : 'members'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">·</span>
                                    <span className="text-sm capitalize text-muted-foreground">
                                        {detail.organization.plan} plan
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
