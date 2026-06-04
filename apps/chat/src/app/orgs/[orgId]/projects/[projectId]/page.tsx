'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import {
    LayoutDesktop,
    LayoutLoadError,
    LayoutLoading,
    LayoutMobile,
} from './components/layout';
import { ROUTE_PATHS } from '@/constants/routePaths';
import { useMeContext } from '@/hooks/me';
import { useProjectJobs } from '@/hooks/project';

export default function ProjectWorkspacePage() {
    const params = useParams<{ orgId: string; projectId: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const meContext = useMeContext();
    const jobsQuery = useProjectJobs(params.projectId);

    const project = meContext.scoped?.projects.find((item) => item.id === params.projectId);
    const jobs = jobsQuery.jobs;
    const jobIdFromUrl = searchParams.get('jobId');
    const selectedJob = jobs.find((job) => job.id === jobIdFromUrl) ?? jobs[0];

    const jobConversations = useMemo(
        () => (meContext.data?.conversations ?? []).filter((conversation) => conversation.jobId === selectedJob?.id),
        [meContext.data?.conversations, selectedJob?.id],
    );

    const conversationIdFromUrl = searchParams.get('conversationId');
    const selectedConversation =
        jobConversations.find((conversation) => conversation.id === conversationIdFromUrl) ?? jobConversations[0];

    useEffect(() => {
        if (!selectedJob || jobConversations.length === 0) {
            return;
        }

        const hasValidConversationId =
            conversationIdFromUrl !== null && jobConversations.some((c) => c.id === conversationIdFromUrl);

        if (hasValidConversationId) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set('jobId', selectedJob.id);
        nextParams.set('conversationId', jobConversations[0]!.id);
        router.replace(
            ROUTE_PATHS.ProjectWorkspace(params.orgId, params.projectId, {
                jobId: selectedJob.id,
                conversationId: jobConversations[0]!.id,
            }),
        );
    }, [
        conversationIdFromUrl,
        jobConversations,
        params.orgId,
        params.projectId,
        router,
        searchParams,
        selectedJob,
    ]);

    if (meContext.isLoading || jobsQuery.isLoading) {
        return <LayoutLoading />;
    }

    if (meContext.isError || jobsQuery.isError || !project) {
        return <LayoutLoadError onRetry={jobsQuery.refetch} />;
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <LayoutDesktop
                orgId={params.orgId}
                projectId={params.projectId}
                jobs={jobs}
                selectedJob={selectedJob}
                selectedConversation={selectedConversation}
            />
            <LayoutMobile
                orgId={params.orgId}
                projectId={params.projectId}
                jobs={jobs}
                selectedJob={selectedJob}
                selectedConversation={selectedConversation}
            />
        </div>
    );
}
