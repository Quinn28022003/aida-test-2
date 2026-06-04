'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '@aida/ui';

import { WorkItemsTabs } from './components/workItemsTabs';
import { useMeContext } from '@/hooks/me';
import { useOrgProjects } from '@/hooks/organization';

export default function OrgProjectsPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const meContext = useMeContext();
    const projectsQuery = useOrgProjects(orgId);

    const organization = useMemo(
        () => meContext.scoped?.organizations.find((item) => item.id === orgId),
        [meContext.scoped?.organizations, orgId],
    );

    if (meContext.isLoading || projectsQuery.isLoading) {
        return (
            <div className="relative min-h-96 w-full">
                <LoadingSpinner text="Loading work items" />
            </div>
        );
    }

    if (meContext.isError || projectsQuery.isError) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">We could not load work items.</p>
                <Button type="button" onClick={() => void projectsQuery.refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!organization) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Organisation not found</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    You do not have access to this organisation, or it does not exist.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <WorkItemsTabs orgId={orgId} projects={projectsQuery.projects} />
        </div>
    );
}
