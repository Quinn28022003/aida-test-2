import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OrgPage from './page';

const { meContextMocks, defaultScoped } = vi.hoisted(() => {
    const defaultScoped = {
        organizations: [
            {
                id: 'org-1',
                name: 'Acme',
                createdAt: '2026-01-01T00:00:00.000Z',
                createdBy: 'profile-1',
                dataRegion: 'au',
                defaultLocale: 'en-AU',
                plan: 'pro',
                slug: 'acme',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        projects: [
            {
                id: 'proj-1',
                orgId: 'org-1',
                name: 'Kitchen Renovation',
                status: 'active' as const,
                description: 'Renovation',
                key: 'KITCHEN',
                createdAt: '2026-01-01T00:00:00.000Z',
                createdBy: 'profile-1',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        jobs: [
            {
                id: 'job-1',
                orgId: 'org-1',
                projectId: 'proj-1',
                title: 'Prepare tax return',
                status: 'open' as const,
                createdAt: '2026-01-02T00:00:00.000Z',
                createdBy: 'profile-1',
                customerProfileId: 'customer-1',
                externalRef: null,
                metadata: {},
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
        ],
        isExternalUser: false,
        canManageBilling: true,
    };

    return {
        defaultScoped,
        meContextMocks: {
            scoped: defaultScoped,
            data: {
                memberships: {
                    organizations: [{ orgId: 'org-1' }],
                    projects: [],
                    jobs: [],
                    agents: [],
                    conversations: [],
                },
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        },
    };
});

vi.mock('next/navigation', () => ({
    useParams: () => ({ orgId: 'org-1' }),
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => meContextMocks,
}));

vi.mock('@/hooks/profile', () => ({
    useProfile: () => ({
        data: { id: 'profile-1' },
    }),
}));

describe('OrgPage', () => {
    beforeEach(() => {
        meContextMocks.isLoading = false;
        meContextMocks.isError = false;
        meContextMocks.scoped = structuredClone(defaultScoped);
        meContextMocks.data = {
            memberships: {
                organizations: [{ orgId: 'org-1' }],
                projects: [],
                jobs: [],
                agents: [],
                conversations: [],
            },
        };
    });

    it('shows section titles and skeletons while me context is loading', () => {
        meContextMocks.isLoading = true;
        meContextMocks.scoped = undefined as unknown as typeof meContextMocks.scoped;
        meContextMocks.data = undefined as unknown as typeof meContextMocks.data;

        render(<OrgPage />);

        expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
        expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    });

    it('renders organisation summary and project jobs', () => {
        render(<OrgPage />);

        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
        expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
        expect(screen.getByText('Prepare tax return')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Prepare tax return/i })).toHaveAttribute(
            'href',
            '/orgs/org-1/projects/proj-1?jobId=job-1',
        );
        expect(screen.getByRole('link', { name: 'View project' })).toHaveAttribute(
            'href',
            '/orgs/org-1/projects/proj-1',
        );
    });

    it('shows empty projects state while keeping summary', () => {
        meContextMocks.scoped!.projects = [];
        meContextMocks.scoped!.jobs = [];

        render(<OrgPage />);

        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('No projects yet.')).toBeInTheDocument();
    });
});
