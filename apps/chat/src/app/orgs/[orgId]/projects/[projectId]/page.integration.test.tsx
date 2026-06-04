import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Header } from '@/components/mainLayout/header';
import { createQueryWrapper } from '@/test/test-utils';
import ProjectWorkspacePage from './page';

vi.mock('next/navigation', () => ({
    useParams: () => ({ orgId: 'org-1', projectId: 'proj-1' }),
    useSearchParams: () => new URLSearchParams('jobId=job-1'),
    usePathname: () => '/orgs/org-1/projects/proj-1',
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

vi.mock('react-resizable-panels', () => ({
    Group: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Separator: () => null,
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
            conversations: [],
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

vi.mock('@/hooks/project', () => ({
    useProjectJobs: () => ({
        jobs: [
            {
                id: 'job-1',
                title: 'Cabinet install',
                status: 'open',
                createdAt: '2026-05-28T12:00:00.000Z',
            },
        ],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    }),
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
    useJobMembers: () => ({
        data: [],
        isLoading: false,
        isError: false,
    }),
    useCreateJob: () => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
    }),
    useCreateConversation: () => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
    }),
}));

vi.mock('./components/layout/jobs/createConversationDialog', () => ({
    CreateConversationDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));

vi.mock('@/services/project.service', () => ({
    ProjectService: {
        listMembers: vi.fn().mockResolvedValue([]),
    },
}));

describe('Project workspace chrome', () => {
    it('renders project header controls only once across header and page', () => {
        render(
            <>
                <Header />
                <ProjectWorkspacePage />
            </>,
            { wrapper: createQueryWrapper() },
        );

        expect(screen.getAllByRole('link', { name: 'Back to projects' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Search' })).toHaveLength(1);
        expect(screen.getAllByRole('heading', { name: 'Kitchen Renovation' })).toHaveLength(1);
    });
});
