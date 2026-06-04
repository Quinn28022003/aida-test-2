'use client';

import type { OrganizationMembersRow, OrganizationsRow } from '@aida/db';

import { OrganizationCard } from '@/components/organization/organizationCard';
import { ROUTE_PATHS } from '@/constants/routePaths';

type OrgPickerSectionProps = {
    organizations: OrganizationsRow[];
    organizationMemberships: OrganizationMembersRow[];
    profileId: string | undefined;
};

export function OrgPickerSection({
    organizations,
    organizationMemberships,
    profileId,
}: OrgPickerSectionProps) {
    return (
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
                        href={ROUTE_PATHS.OrgProjects(organization.id)}
                    />
                );
            })}
        </div>
    );
}
