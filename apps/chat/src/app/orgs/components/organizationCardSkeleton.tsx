import { Skeleton } from '@aida/ui';

export function OrganizationCardSkeleton() {
    return (
        <div className="rounded-2xl border-0 bg-card p-5 shadow-sm" aria-hidden>
            <div className="flex items-start gap-4">
                <Skeleton className="size-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}

type OrganizationCardSkeletonGridProps = {
    count?: number;
};

export function OrganizationCardSkeletonGrid({ count = 2 }: OrganizationCardSkeletonGridProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading organisations">
            {Array.from({ length: count }, (_, index) => (
                <OrganizationCardSkeleton key={index} />
            ))}
        </div>
    );
}
