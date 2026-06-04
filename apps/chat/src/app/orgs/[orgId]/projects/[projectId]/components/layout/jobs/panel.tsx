'use client';

import type { ConversationsRow, JobsRow } from '@aida/db';
import { Button } from '@aida/ui';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { projectAgentsQueryKey, projectMembersQueryKey } from '@/constants/queryKeys';
import { useJobMembers } from '@/hooks/project';
import { useMeContext } from '@/hooks/me';
import { ProjectService } from '@/services/project.service';

import { CreateJobDialog } from './createJobDialog';
import {
    PanelBody,
    PanelFooter,
    PanelHeader,
    PanelShell,
} from '../panelLayout';
import { JobCard } from './jobCard';

type JobsPanelProps = {
    orgId: string;
    projectId: string;
    jobs: JobsRow[];
    selectedJob: JobsRow | undefined;
    selectedConversationId?: string;
};

export function JobsPanel({ orgId, projectId, jobs, selectedJob, selectedConversationId }: JobsPanelProps) {
    const meContext = useMeContext();
    const priorityCount = jobs.length;
    const selectedJobId = selectedJob?.id;

    const jobMembersQuery = useJobMembers({
        projectId,
        jobId: selectedJobId,
        enabled: Boolean(selectedJobId),
    });

    const projectMembersQuery = useQuery({
        queryKey: projectMembersQueryKey(projectId),
        queryFn: () => ProjectService.listMembers(projectId),
    });

    const projectAgentsQuery = useQuery({
        queryKey: projectAgentsQueryKey(projectId),
        queryFn: () => ProjectService.listAgents(projectId),
    });

    const projectRoleByUserId = useMemo(() => {
        const roles = new Map<string, string>();
        for (const member of projectMembersQuery.data ?? []) {
            roles.set(member.userId, member.projectRole);
        }
        return roles;
    }, [projectMembersQuery.data]);

    const projectAgents = useMemo(
        () => projectAgentsQuery.data?.map((item) => item.agent).filter((agent) => agent.status === 'active') ?? [],
        [projectAgentsQuery.data],
    );

    const conversationsByJobId = useMemo(() => {
        const grouped = new Map<string, ConversationsRow[]>();
        for (const conversation of meContext.data?.conversations ?? []) {
            const existing = grouped.get(conversation.jobId) ?? [];
            existing.push(conversation);
            grouped.set(conversation.jobId, existing);
        }
        return grouped;
    }, [meContext.data?.conversations]);

    return (
        <PanelShell>
            <PanelHeader>
                <div className="min-w-0">
                    <h3 className="m-0 text-base font-semibold text-foreground">Jobs</h3>
                    <p className="m-0 mt-1 text-sm text-muted-foreground">
                        {priorityCount} {priorityCount === 1 ? 'priority' : 'priorities'} today
                    </p>
                </div>
            </PanelHeader>

            <PanelBody scrollable className="space-y-4 px-5 py-4">
                {jobs.length === 0 ? (
                    <p className="m-0 text-sm text-muted-foreground">No jobs in this project yet.</p>
                ) : (
                    jobs.map((job) => (
                        <JobCard
                            key={job.id}
                            orgId={orgId}
                            projectId={projectId}
                            job={job}
                            active={selectedJobId === job.id}
                            selectedConversationId={
                                selectedJobId === job.id ? selectedConversationId : undefined
                            }
                            jobConversations={
                                selectedJobId === job.id ? conversationsByJobId.get(job.id) : undefined
                            }
                            jobMembers={selectedJobId === job.id ? jobMembersQuery.data : undefined}
                            projectAgents={projectAgents}
                            projectRoleByUserId={projectRoleByUserId}
                        />
                    ))
                )}
            </PanelBody>

            <PanelFooter>
                <CreateJobDialog
                    orgId={orgId}
                    projectId={projectId}
                    trigger={
                        <Button type="button" className="w-full">
                            + Create job ticket
                        </Button>
                    }
                />
            </PanelFooter>
        </PanelShell>
    );
}
