'use client';

import type { AgentsRow, ConversationsRow, JobMembersRow, JobsRow } from '@aida/db';
import { Avatar, AvatarFallback, Button, cn } from '@aida/ui';
import Link from 'next/link';

import { CreateConversationDialog } from '../createConversationDialog';

function MemberAvatar({ label, className }: { label: string; className?: string }) {
    const initials = label
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="relative shrink-0">
            <Avatar className={cn('size-9', className)}>
                <AvatarFallback className="bg-muted text-xs font-medium text-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
    );
}

function formatMemberRole(member: JobMembersRow, projectRoleByUserId: Map<string, string>) {
    const projectRole = projectRoleByUserId.get(member.userId);
    if (projectRole) {
        return projectRole.replaceAll('_', ' ');
    }

    return member.memberKind;
}

function formatMemberLabel(userId: string) {
    return `Member ${userId.slice(0, 8)}`;
}

function jobHref(orgId: string, projectId: string, jobId: string, conversationId?: string) {
    const params = new URLSearchParams({ jobId });
    if (conversationId) {
        params.set('conversationId', conversationId);
    }
    return `/orgs/${orgId}/projects/${projectId}?${params.toString()}`;
}

type JobCardExpandedSectionsProps = {
    orgId: string;
    projectId: string;
    job: JobsRow;
    selectedConversationId?: string;
    conversations: ConversationsRow[];
    members: JobMembersRow[];
    agents: AgentsRow[];
    projectRoleByUserId: Map<string, string>;
};

export function JobCardExpandedSections({
    orgId,
    projectId,
    job,
    selectedConversationId,
    conversations,
    members,
    agents,
    projectRoleByUserId,
}: JobCardExpandedSectionsProps) {
    return (
        <>
            <div className="my-4 border-t border-border" />

            <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Conversations
                    </p>
                    {conversations.length > 0 ? (
                        <CreateConversationDialog
                            orgId={orgId}
                            projectId={projectId}
                            jobId={job.id}
                            defaultTitle={job.title}
                            trigger={
                                <button
                                    type="button"
                                    className="m-0 shrink-0 border-0 bg-transparent p-0 text-xs font-medium text-primary hover:underline"
                                >
                                    + New
                                </button>
                            }
                        />
                    ) : null}
                </div>
                {conversations.length === 0 ? (
                    <div className="space-y-2">
                        <p className="m-0 text-sm text-muted-foreground">No conversations yet.</p>
                        <CreateConversationDialog
                            orgId={orgId}
                            projectId={projectId}
                            jobId={job.id}
                            defaultTitle={job.title}
                            trigger={
                                <Button type="button" variant="outline" size="sm" className="w-full">
                                    + Start conversation
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <ul className="m-0 list-none space-y-1 p-0">
                        {conversations.map((conversation) => {
                            const isSelected = conversation.id === selectedConversationId;
                            return (
                                <li key={conversation.id}>
                                    <Link
                                        href={jobHref(orgId, projectId, job.id, conversation.id)}
                                        className={cn(
                                            'block rounded-lg px-2 py-1.5 no-underline transition',
                                            isSelected
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-foreground hover:bg-muted',
                                        )}
                                        aria-current={isSelected ? 'true' : undefined}
                                    >
                                        <p className="m-0 truncate text-sm font-medium">{conversation.title}</p>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="mt-4 space-y-3">
                <p className="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Team</p>
                {members.length === 0 ? (
                    <p className="m-0 text-sm text-muted-foreground">No team members yet.</p>
                ) : (
                    <ul className="m-0 list-none space-y-3 p-0">
                        {members.map((member) => {
                            const label = formatMemberLabel(member.userId);
                            return (
                                <li key={member.id} className="flex min-w-0 items-center gap-3">
                                    <MemberAvatar label={label} />
                                    <div className="min-w-0">
                                        <p className="m-0 truncate text-sm font-medium text-foreground">{label}</p>
                                        <p className="m-0 truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                            {formatMemberRole(member, projectRoleByUserId)}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="mt-4 space-y-3">
                <p className="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    AI agents
                </p>
                {agents.length === 0 ? (
                    <p className="m-0 text-sm text-muted-foreground">No AI agents yet.</p>
                ) : (
                    <ul className="m-0 list-none space-y-3 p-0">
                        {agents.map((agent) => (
                            <li key={agent.id} className="flex min-w-0 items-center gap-3">
                                <MemberAvatar label={agent.name} className="bg-primary/10" />
                                <div className="min-w-0">
                                    <p className="m-0 truncate text-sm font-medium text-foreground">{agent.name}</p>
                                    <p className="m-0 truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                        {agent.key.replaceAll('_', ' ')}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}
