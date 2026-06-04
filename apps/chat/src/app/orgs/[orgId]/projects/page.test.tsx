import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';
import OrgProjectsPage from './page';

vi.mock('next/navigation', () => ({
    useParams: () => ({ orgId: 'org-1' }),
}));

const meContextMocks = vi.hoisted(() => ({
    scoped: {
        organizations: [{ id: 'org-1', name: 'ABC Accountants', createdBy: 'profile-1' }],
        projects: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
}));

const orgProjectsMocks = vi.hoisted(() => ({
    projects: [
        {
            id: 'project-1',
            orgId: 'org-1',
            name: '24/25 Income Tax Returns',
            description: 'New action items',
            status: 'active' as const,
        },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => meContextMocks,
}));

vi.mock('@/hooks/organization', () => ({
    useOrgProjects: () => orgProjectsMocks,
}));

describe('OrgProjectsPage', () => {
    beforeEach(() => {
        meContextMocks.scoped.organizations = [
            { id: 'org-1', name: 'ABC Accountants', createdBy: 'profile-1' },
        ];
        orgProjectsMocks.projects = [
            {
                id: 'project-1',
                orgId: 'org-1',
                name: '24/25 Income Tax Returns',
                description: 'New action items',
                status: 'active',
            },
        ];
        orgProjectsMocks.isLoading = false;
        orgProjectsMocks.isError = false;
    });

    it('shows loading spinner while work items are loading', () => {
        orgProjectsMocks.isLoading = true;

        render(<OrgProjectsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Loading work items')).toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: 'Projects' })).not.toBeInTheDocument();
    });

    it('renders work items list and start project action', () => {
        render(<OrgProjectsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByRole('tab', { name: 'Projects' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Conversations' })).toBeInTheDocument();
        expect(screen.getByText('24/25 Income Tax Returns')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start new project' })).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Conversations' }));

        expect(screen.queryByRole('button', { name: 'Start new project' })).not.toBeInTheDocument();
    });

    it('shows not found when organisation is missing', () => {
        meContextMocks.scoped.organizations = [];

        render(<OrgProjectsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Organisation not found')).toBeInTheDocument();
    });

    it('shows empty state when organisation has no projects', () => {
        orgProjectsMocks.projects = [];

        render(<OrgProjectsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('No work items yet')).toBeInTheDocument();
        expect(screen.getByText('This organisation has no projects yet.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start new project' })).toBeInTheDocument();
    });
});
