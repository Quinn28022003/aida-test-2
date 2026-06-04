import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';
import { JobsPanel } from './panel';

vi.mock('@/hooks/me', () => ({
    useMeContext: () => ({
        data: {
            agents: [],
            conversations: [
                {
                    id: 'conv-1',
                    orgId: 'org-1',
                    projectId: 'proj-1',
                    jobId: 'job-1',
                    title: 'Tax thread',
                    status: 'open',
                    priority: 'normal',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                    createdBy: 'profile-1',
                    primaryAgentId: null,
                    metadata: {},
                },
            ],
        },
    }),
}));

vi.mock('@/hooks/project', () => ({
    useJobMembers: () => ({
        data: [
            {
                id: 'member-1',
                orgId: 'org-1',
                projectId: 'proj-1',
                jobId: 'job-1',
                userId: 'profile-1',
                memberKind: 'internal',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/services/project.service', () => ({
    ProjectService: {
        listAgents: vi.fn().mockResolvedValue([
            {
                projectAgent: {
                    id: 'project-agent-1',
                    orgId: 'org-1',
                    projectId: 'proj-1',
                    agentId: 'agent-1',
                    visibility: 'restricted',
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
                agent: {
                    id: 'agent-1',
                    orgId: 'org-1',
                    activeVersionId: null,
                    createdBy: null,
                    description: null,
                    status: 'active',
                    name: 'Dimitri',
                    key: 'tax_assistant',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
                activeVersion: null,
            },
        ]),
        listMembers: vi.fn().mockResolvedValue([
            {
                id: 'project-member-1',
                orgId: 'org-1',
                projectId: 'proj-1',
                userId: 'profile-1',
                projectRole: 'owner',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ]),
    },
}));

vi.mock('./createJobDialog', () => ({
    CreateJobDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

vi.mock('./createConversationDialog', () => ({
    CreateConversationDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

const selectedJob = {
    id: 'job-1',
    orgId: 'org-1',
    projectId: 'proj-1',
    title: 'Carly Jones',
    status: 'open' as const,
    createdAt: '2026-05-28T12:00:00.000Z',
    createdBy: 'profile-1',
    customerProfileId: 'customer-1',
    externalRef: null,
    metadata: {},
    updatedAt: '2026-05-28T12:00:00.000Z',
};

describe('JobsPanel', () => {
    it('renders expanded job card with conversations, team, and ai agents', async () => {
        render(
            <JobsPanel
                orgId="org-1"
                projectId="proj-1"
                jobs={[selectedJob]}
                selectedJob={selectedJob}
                selectedConversationId="conv-1"
            />,
            { wrapper: createQueryWrapper() },
        );

        expect(await screen.findByText('Conversations')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Tax thread' })).toHaveAttribute(
            'href',
            '/orgs/org-1/projects/proj-1?jobId=job-1&conversationId=conv-1',
        );
        expect(screen.getByRole('link', { name: 'Tax thread' })).toHaveAttribute('aria-current', 'true');
        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.getByText('AI agents')).toBeInTheDocument();
        expect(await screen.findByText('Dimitri')).toBeInTheDocument();
        expect(screen.getByText('1 priority today')).toBeInTheDocument();
    });
});
