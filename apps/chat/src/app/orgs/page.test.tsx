import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/constants/routePaths';
import { createQueryWrapper } from '@/test/test-utils';
import OrgsPage from './page';

const meContextMocks = vi.hoisted(() => ({
    scoped: {
        organizations: [{ id: 'org-1', name: 'ABC Accountants', createdBy: 'profile-1' }],
    },
    data: {
        memberships: {
            organizations: [{ orgId: 'org-1', userId: 'profile-1' }],
        },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
}));

const profileMocks = vi.hoisted(() => ({
    data: {
        id: 'profile-1',
        displayName: 'Quinn',
        email: 'quinn@example.com',
    },
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => meContextMocks,
}));

vi.mock('@/hooks/profile', () => ({
    useProfile: () => profileMocks,
}));

vi.mock('@/hooks/organization', () => ({
    useCreateOrganization: () => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
    }),
}));

describe('OrgsPage', () => {
    beforeEach(() => {
        meContextMocks.scoped.organizations = [
            { id: 'org-1', name: 'ABC Accountants', createdBy: 'profile-1' },
        ];
        meContextMocks.data.memberships.organizations = [{ orgId: 'org-1', userId: 'profile-1' }];
        meContextMocks.isLoading = false;
        meContextMocks.isError = false;
    });

    it('renders organisation picker cards linking to org projects', () => {
        render(<OrgsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Choose an organisation')).toBeInTheDocument();
        expect(screen.getByText('Select the organisation you want to work in.')).toBeInTheDocument();
        expect(screen.getByText('ABC Accountants')).toBeInTheDocument();
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('1 member')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /ABC Accountants/i })).toHaveAttribute(
            'href',
            ROUTE_PATHS.OrgProjects('org-1'),
        );
    });

    it('shows create organisation state when no organisations exist', () => {
        meContextMocks.scoped.organizations = [];

        render(<OrgsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Choose an organisation')).toBeInTheDocument();
        expect(screen.getByText('Create your organisation to start work items')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create my organisation' })).toBeInTheDocument();
    });

    it('shows static header and skeleton cards while loading', () => {
        meContextMocks.isLoading = true;
        meContextMocks.scoped.organizations = [];

        render(<OrgsPage />, { wrapper: createQueryWrapper() });

        expect(screen.getByText('Choose an organisation')).toBeInTheDocument();
        expect(screen.getByText('Select the organisation you want to work in.')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading organisations')).toBeInTheDocument();
        expect(screen.queryByText('ABC Accountants')).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /ABC Accountants/i })).not.toBeInTheDocument();
    });
});
