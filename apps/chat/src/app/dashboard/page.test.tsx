import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';
import DashboardPage from './page';

const meContextMocks = vi.hoisted(() => ({
    scoped: {
        organizations: [
            { id: 'org-1', name: 'ABC Accountants', plan: 'basic' },
            { id: 'org-2', name: 'Design Studio', plan: null },
        ],
        projects: [{ id: 'project-1' }],
        jobs: [
            { id: 'job-1', title: 'Carly Jones', status: 'open', createdAt: '2026-05-28T12:00:00.000Z' },
            { id: 'job-2', title: 'Edward Smith', status: 'open', createdAt: '2026-05-28T11:00:00.000Z' },
        ],
        isExternalUser: false,
        canManageBilling: true,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
}));
const profileMocks = vi.hoisted(() => ({
    data: {
        id: 'profile-1',
        displayName: 'Quinn',
        email: 'quinn@example.com',
    },
}));
const createOrganizationMocks = vi.hoisted(() => ({
    create: vi.fn(async () => ({ id: 'org-new', name: 'Quinn Organisation', slug: 'quinn-organisation' })),
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => meContextMocks,
}));
vi.mock('@/hooks/profile', () => ({
    useProfile: () => profileMocks,
}));
vi.mock('@/services/organization.service', () => ({
    OrganizationService: {
        create: createOrganizationMocks.create,
    },
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        meContextMocks.isLoading = false;
        meContextMocks.isError = false;
        meContextMocks.error = null;
        meContextMocks.scoped = {
            organizations: [
                { id: 'org-1', name: 'ABC Accountants', plan: 'basic', createdBy: 'profile-1' },
                { id: 'org-2', name: 'Design Studio', plan: null, createdBy: 'another-profile' },
            ],
            projects: [{ id: 'project-1' }],
            jobs: [
                { id: 'job-1', title: 'Carly Jones', status: 'open', createdAt: '2026-05-28T12:00:00.000Z' },
                { id: 'job-2', title: 'Edward Smith', status: 'open', createdAt: '2026-05-28T11:00:00.000Z' },
            ],
            isExternalUser: false,
            canManageBilling: true,
        };
        profileMocks.data = {
            id: 'profile-1',
            displayName: 'Quinn',
            email: 'quinn@example.com',
        };
        createOrganizationMocks.create.mockClear();
    });

    it('renders dashboard sections from me context', () => {
        render(<DashboardPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Recent jobs')).toBeInTheDocument();
        expect(screen.getByText('Business connect')).toBeInTheDocument();
        expect(screen.getByText('Subscriptions')).toBeInTheDocument();
        expect(screen.getByText('ABC Accountants')).toBeInTheDocument();
    });

    it('shows invite CTA when user has joined orgs but no owned org', () => {
        meContextMocks.scoped.organizations = [{ id: 'org-2', name: 'Shared Org', createdBy: 'another-profile' }];
        profileMocks.data.id = 'profile-1';

        render(<DashboardPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Create your own organisation')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create my organisation' })).toBeInTheDocument();
    });

    it('shows section titles and subscriptions while dynamic data is loading', () => {
        meContextMocks.isLoading = true;
        meContextMocks.scoped = undefined as unknown as typeof meContextMocks.scoped;

        render(<DashboardPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Recent jobs')).toBeInTheDocument();
        expect(screen.getByText('Business connect')).toBeInTheDocument();
        expect(screen.getByText('Subscriptions')).toBeInTheDocument();
        expect(screen.getByText('Token Usage')).toBeInTheDocument();
    });

    it('shows error state in dynamic sections when me context fails', () => {
        meContextMocks.isLoading = false;
        meContextMocks.isError = true;
        meContextMocks.error = new Error('Network failed');

        render(<DashboardPage />, { wrapper: createQueryWrapper() });

        expect(screen.getAllByText('Network failed')).toHaveLength(2);
        expect(screen.getByText('Subscriptions')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('shows business connect section title when user has no org access', () => {
        meContextMocks.scoped.organizations = [];

        render(<DashboardPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Business connect')).toBeInTheDocument();
        expect(
            screen.queryByText('You do not have access to any organisations yet. Create one now to start using AIDA.'),
        ).not.toBeInTheDocument();
    });
});
