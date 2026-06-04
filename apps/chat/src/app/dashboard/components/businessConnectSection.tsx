'use client';

import type { OrganizationMembersRow, OrganizationsRow } from '@aida/db';
import { Card, CardContent, Skeleton } from '@aida/ui';

import { OrganizationCard } from '@/components/organization/organizationCard';
import { ROUTE_PATHS } from '@/constants/routePaths';

type BusinessConnectSectionProps = {
    organizations: OrganizationsRow[];
    organizationMemberships: OrganizationMembersRow[];
    profileId: string | undefined;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function BusinessConnectSection({
    organizations,
    organizationMemberships,
    profileId,
    isLoading = false,
    isError = false,
    errorMessage,
}: BusinessConnectSectionProps) {
    return (
        <section>
            <h3 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">Business connect</h3>

            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-36 rounded-2xl" />
                    <Skeleton className="h-36 rounded-2xl" />
                </div>
            )}

            {!isLoading && isError && (
                <Card className="rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0 text-destructive">
                            {errorMessage ?? 'We could not load your organisations.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && organizations.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {organizations.map((organization) => {
                        const memberCount = organizationMemberships.filter(
                            (membership) => membership.orgId === organization.id,
                        ).length;

                        return (
                            <OrganizationCard
                                key={organization.id}
                                name={organization.name}
                                role={organization.createdBy === profileId ? 'Owner' : 'Member'}
                                memberCount={memberCount}
                                href={ROUTE_PATHS.OrgDetail(organization.id)}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
