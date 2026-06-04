import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';
import ProjectWorkspacePage from './page';

const navigationMocks = vi.hoisted(() => ({
    searchParams: new URLSearchParams('jobId=job-1'),
    replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useParams: () => ({ orgId: 'org-1', projectId: 'proj-1' }),
    useSearchParams: () => navigationMocks.searchParams,
    useRouter: () => ({
        push: vi.fn(),
        replace: navigationMocks.replace,
    }),
}));

vi.mock('react-resizable-panels', () => ({
    Group: ({ children }: { children: React.ReactNode }) => <div data-testid="workspace-group">{children}</div>,
    Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="workspace-panel">{children}</div>,
    Separator: () => <div data-testid="workspace-separator" />,
}));

const meContextMocks = vi.hoisted(() => ({
    conversations: [] as Array<{
        id: string;
        orgId: string;
        projectId: string;
        jobId: string;
        title: string;
        status: string;
        priority: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        primaryAgentId: null;
        metadata: Record<string, unknown>;
    }>,
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => ({
        scoped: {
            organizations: [{ id: 'org-1', name: 'Acme' }],
            projects: [{ id: 'proj-1', name: 'Kitchen Renovation' }],
            jobs: [{ id: 'job-1', title: 'Cabinet install' }],
            isExternalUser: true,
        },
        data: {
            agents: [],
            conversations: meContextMocks.conversations,
            memberships: {
                organizations: [],
                projects: [],
                jobs: [],
                agents: [],
                conversations: [],
            },
        },
        isLoading: false,
        isError: false,
    }),
}));

const jobMembersMocks = vi.hoisted(() => ({
    data: [] as Array<{ id: string; userId: string; memberKind: string }>,
}));

vi.mock('@/hooks/project', () => ({
    useProjectJobs: () => ({
        jobs: [
            {
                id: 'job-1',
                title: 'Cabinet install',
                status: 'open',
                createdAt: '2026-05-28T12:00:00.000Z',
            },
            {
                id: 'job-2',
                title: 'Benchtop quote',
                status: 'open',
                createdAt: '2026-05-28T10:00:00.000Z',
            },
        ],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    }),
    useJobMembers: () => ({
        data: jobMembersMocks.data,
        isLoading: false,
        isError: false,
    }),
    useCreateJob: () => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
    }),
}));

vi.mock('./components/layout/context/hooks/context.hooks', () => ({
    useProjectTasks: () => ({
        tasks: [],
        isLoading: false,
        isError: false,
    }),
    useProjectDocuments: () => ({
        clientDocuments: [],
        knowledgeHubs: [],
        isLoading: false,
        isError: false,
    }),
    useProjectTools: () => ({
        tools: [],
        isLoading: false,
        isError: false,
    }),
    useProjectServices: () => ({
        service: null,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('@/services/project.service', () => ({
    ProjectService: {
        listMembers: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('./components/layout/jobs/createConversationDialog', () => ({
    CreateConversationDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

describe('ProjectWorkspacePage', () => {
    beforeEach(() => {
        navigationMocks.searchParams = new URLSearchParams('jobId=job-1');
        meContextMocks.conversations = [];
        navigationMocks.replace.mockClear();
    });

    it('renders resizable workspace panels, job cards, chat, and tasks', () => {
        render(<ProjectWorkspacePage />, { wrapper: createQueryWrapper() });

        expect(screen.getByTestId('workspace-group')).toBeInTheDocument();
        expect(screen.getByTestId('workspace-desktop')).toBeInTheDocument();
        expect(screen.getByTestId('workspace-mobile')).toBeInTheDocument();
        expect(screen.getAllByText('Jobs').length).toBeGreaterThan(0);
        expect(screen.getByText('2 priorities today')).toBeInTheDocument();
        expect(screen.getAllByText('Cabinet install').length).toBeGreaterThan(0);
        expect(screen.getByText('Benchtop quote')).toBeInTheDocument();
        expect(screen.getByText('Conversations')).toBeInTheDocument();
        expect(screen.getByText('No conversations yet.')).toBeInTheDocument();
        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.getByText('No team members yet.')).toBeInTheDocument();
        expect(screen.getByText('AI agents')).toBeInTheDocument();
        expect(screen.getByText('No AI agents yet.')).toBeInTheDocument();
        expect(
            screen.getAllByText("Send me a message and I'll help with whatever you need.").length,
        ).toBeGreaterThan(0);
        const conversationsSection = screen.getByText('Conversations').closest('section');
        expect(conversationsSection).not.toBeNull();
        expect(
            within(conversationsSection as HTMLElement).getByRole('button', { name: '+ Start conversation' }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Conversation shell is active/)).not.toBeInTheDocument();
        expect(screen.getAllByPlaceholderText('Type a message to the team...').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('tab', { name: 'Tasks' }).length).toBeGreaterThan(0);
        expect(screen.getAllByText('No tasks yet.').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: 'Add task' }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: '+ Create job ticket' }).length).toBeGreaterThan(0);
    });

    it('shows chat panel title from selected conversation', () => {
        meContextMocks.conversations = [
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
        ];
        navigationMocks.searchParams = new URLSearchParams('jobId=job-1&conversationId=conv-1');

        render(<ProjectWorkspacePage />, { wrapper: createQueryWrapper() });

        expect(screen.getAllByRole('heading', { name: 'Tax thread' }).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Conversation shell is active/).length).toBeGreaterThan(0);
    });

    it('shows team section on the selected job when members exist', () => {
        jobMembersMocks.data = [
            {
                id: 'member-1',
                userId: 'profile-1',
                memberKind: 'internal',
            },
        ];

        render(<ProjectWorkspacePage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.queryByText('No team members yet.')).not.toBeInTheDocument();
        jobMembersMocks.data = [];
    });
});
