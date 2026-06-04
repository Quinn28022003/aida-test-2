'use client';

import {
    BusinessConnectSection,
    CreateOwnOrgInviteCard,
    RecentJobsSection,
    SubscriptionsSection,
} from './components';
import { useMeContext } from '@/hooks/me';
import { useProfile } from '@/hooks/profile';

export default function DashboardPage() {
    const { scoped, data: meContext, isLoading, isError, error } = useMeContext();
    const { data: profile } = useProfile();

    // Organisations the current user can access (from /me, scoped by membership).
    const organizations = scoped?.organizations ?? [];

    // Latest three jobs for the Recent jobs section, newest first.
    const recentJobs =
        scoped?.jobs
            .slice()
            .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
            .slice(0, 3) ?? [];

    // User-facing message when /me fails; passed into dynamic section error states.
    const errorMessage = error instanceof Error ? error.message : 'Please try again.';

    return (
        <div className="-m-4 p-4 md:-m-6 md:p-6">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                <CreateOwnOrgInviteCard />

                <RecentJobsSection
                    jobs={recentJobs}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                />

                <BusinessConnectSection
                    organizations={organizations}
                    organizationMemberships={meContext?.memberships.organizations ?? []}
                    profileId={profile?.id}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                />

                <SubscriptionsSection canManageBilling={scoped?.canManageBilling ?? false} />
            </div>
        </div>
    );
}
