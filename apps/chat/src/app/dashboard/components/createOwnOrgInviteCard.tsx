'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@aida/ui';

import { useMeContext } from '@/hooks/me';
import { useCreateOrganization } from '@/hooks/organization';
import { useProfile } from '@/hooks/profile';

export function CreateOwnOrgInviteCard() {
    const { scoped, isLoading, isError } = useMeContext();
    const { data: profile } = useProfile();
    const createOrganizationMutation = useCreateOrganization();

    const organizations = scoped?.organizations ?? [];
    const shouldShow =
        !isLoading &&
        !isError &&
        organizations.length > 0 &&
        (!profile?.id || !organizations.some((organization) => organization.createdBy === profile.id));

    return (
        shouldShow && (
            <Card className="rounded-2xl border-0 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle>Create your own organisation</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        You currently have access to shared businesses. Create your own organisation for your personal
                        workspace.
                    </p>

                    {createOrganizationMutation.isError && (
                        <p className="text-destructive">
                            {createOrganizationMutation.error instanceof Error
                                ? createOrganizationMutation.error.message
                                : 'Could not create your organisation. Please try again.'}
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => createOrganizationMutation.mutate()}
                        disabled={createOrganizationMutation.isPending}
                        loadingDots={createOrganizationMutation.isPending}
                        textLoading="Creating organization"
                    >
                        Create my organisation
                    </Button>
                </CardContent>
            </Card>
        )
    );
}
