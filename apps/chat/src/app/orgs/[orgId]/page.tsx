// TODO: This page is currently not linked from anywhere. We will add a link to it from the org list page once we have that page implemented.

'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { OrgDetailSummary } from './components/orgDetailSummary';
import { OrgJobsSection } from './components/orgJobsSection';
import { OrgProjectsSection } from './components/orgProjectsSection';
import { useMeContext } from '@/hooks/me';
import { useProfile } from '@/hooks/profile';
import { getOrgDetail } from './lib/orgDetail';

export default function OrgPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const meContext = useMeContext();
    const { data: profile } = useProfile();

    const detail = useMemo(() => {
        if (!meContext.scoped || !meContext.data) {
            return null;
        }

        return getOrgDetail(meContext.scoped, meContext.data.memberships, orgId, profile?.id);
    }, [meContext.data, meContext.scoped, orgId, profile?.id]);

    const errorMessage = meContext.error instanceof Error ? meContext.error.message : 'Please try again.';

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <OrgDetailSummary
                detail={detail}
                isLoading={meContext.isLoading}
                isError={meContext.isError}
                errorMessage={errorMessage}
            />

            <OrgProjectsSection
                orgId={orgId}
                detail={detail}
                isLoading={meContext.isLoading}
                isError={meContext.isError}
                errorMessage={errorMessage}
            />

            <OrgJobsSection
                orgId={orgId}
                detail={detail}
                isLoading={meContext.isLoading}
                isError={meContext.isError}
                errorMessage={errorMessage}
            />
        </div>
    );
}
