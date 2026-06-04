'use client';

import type { AgentsRow, ConversationsRow, JobMembersRow, JobsRow } from '@aida/db';
import { cn, MoreVerticalIcon } from '@aida/ui';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';

import { ROUTE_PATHS } from '@/constants/routePaths';

import { JobCardExpandedSections } from './components/jobCardExpandedSections';
import { JobCardHeader } from './components/jobCardHeader';

type JobCardProps = {
    orgId: string;
    projectId: string;
    job: JobsRow;
    active: boolean;
    selectedConversationId?: string;
    jobConversations: ConversationsRow[] | undefined;
    jobMembers: JobMembersRow[] | undefined;
    projectAgents: AgentsRow[];
    projectRoleByUserId: Map<string, string>;
};

export function JobCard({
    orgId,
    projectId,
    job,
    active,
    selectedConversationId,
    jobConversations,
    jobMembers,
    projectAgents,
    projectRoleByUserId,
}: JobCardProps) {
    const href = ROUTE_PATHS.ProjectWorkspace(orgId, projectId, { jobId: job.id });
    const conversations = jobConversations ?? [];
    const members = jobMembers ?? [];
    const agents = projectAgents;

    const actionsButton = (
        <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={`Actions for ${job.title}`}
            onClick={(event) => {
                event.preventDefault();
            }}
        >
            <MoreVerticalIcon />
        </button>
    );

    const footer = (
        <p className="m-0 mt-4 text-right text-xs text-muted-foreground">
            {formatDistanceToNowStrict(new Date(job.createdAt), { addSuffix: true })}
        </p>
    );

    if (active) {
        return (
            <div
                className={cn(
                    'block rounded-xl bg-card shadow-sm transition',
                    'border-l-4 border-l-primary',
                )}
            >
                <div className="p-4">
                    <JobCardHeader job={job} active={active} actions={actionsButton} />
                    <JobCardExpandedSections
                        orgId={orgId}
                        projectId={projectId}
                        job={job}
                        selectedConversationId={selectedConversationId}
                        conversations={conversations}
                        members={members}
                        agents={agents}
                        projectRoleByUserId={projectRoleByUserId}
                    />
                    {footer}
                </div>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className="block rounded-xl bg-card shadow-sm no-underline transition hover:shadow-md"
        >
            <div className="p-4">
                <JobCardHeader job={job} active={active} actions={actionsButton} />
                {footer}
            </div>
        </Link>
    );
}
