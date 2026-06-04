'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@aida/ui';

import { OrganizationCardSkeletonGrid } from './components/organizationCardSkeleton';

import { OrgPickerSection } from './components/orgPickerSection';
import { useMeContext } from '@/hooks/me';
import { useCreateOrganization } from '@/hooks/organization';
import { useProfile } from '@/hooks/profile';

export default function OrgsPage() {
    const meContext = useMeContext();
    const { data: profile } = useProfile();
    const createOrganizationMutation = useCreateOrganization();

    const organizations = meContext.scoped?.organizations ?? [];
    const organizationMemberships = meContext.data?.memberships.organizations ?? [];

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <header className="space-y-1">
                <h2 className="mb-0 text-2xl font-semibold tracking-tight text-foreground">Choose an organisation</h2>
                <p className="m-0 text-sm text-muted-foreground">Select the organisation you want to work in.</p>
            </header>

            {meContext.isLoading && <OrganizationCardSkeletonGrid count={2} />}

            {meContext.isError && !meContext.isLoading && (
                <Card>
                    <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                        <p className="m-0">We could not load your organisations.</p>
                        <Button type="button" onClick={() => void meContext.refetch()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!meContext.isLoading && !meContext.isError && organizations.length === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create your organisation to start work items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>You need an organisation before creating projects and jobs.</p>
                        {createOrganizationMutation.isError && (
                            <p className="text-destructive">
                                {createOrganizationMutation.error instanceof Error
                                    ? createOrganizationMutation.error.message
                                    : 'Could not create your organisation. Please try again.'}
                            </p>
                        )}
                        <Button
                            type="button"
                            onClick={() => createOrganizationMutation.mutate()}
                            disabled={createOrganizationMutation.isPending}
                            loadingDots={createOrganizationMutation.isPending}
                            textLoading="Creating..."
                        >
                            Create my organisation
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!meContext.isLoading && !meContext.isError && organizations.length > 0 && (
                <OrgPickerSection
                    organizations={organizations}
                    organizationMemberships={organizationMemberships}
                    profileId={profile?.id}
                />
            )}
        </div>
    );
}
