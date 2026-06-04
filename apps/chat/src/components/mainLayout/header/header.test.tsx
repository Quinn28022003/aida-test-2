import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/constants/routePaths';

import { Header } from './';

const navigationMocks = vi.hoisted(() => ({
    pathname: '/',
}));

vi.mock('next/navigation', () => ({
    usePathname: () => navigationMocks.pathname,
    useParams: () => ({ orgId: 'org-1', projectId: 'proj-1' }),
}));

vi.mock('@/hooks/me', () => ({
    useMeContext: () => ({
        scoped: {
            organizations: [{ id: 'org-1', name: 'Acme Accountants' }],
            projects: [{ id: 'proj-1', name: 'Kitchen Renovation' }],
        },
    }),
}));

describe('Header', () => {
    beforeEach(() => {
        navigationMocks.pathname = '/';
    });

    it('renders the organisation name on org detail route', () => {
        navigationMocks.pathname = '/orgs/org-1';

        render(<Header />);

        expect(screen.getByRole('heading', { name: 'Acme Accountants' })).toBeInTheDocument();
    });

    it('shows work items title on org picker route', () => {
        navigationMocks.pathname = '/orgs';

        render(<Header />);

        expect(screen.getByRole('heading', { name: 'Work items' })).toBeInTheDocument();
    });

    it('shows work items title on org projects route', () => {
        navigationMocks.pathname = '/orgs/org-1/projects';

        render(<Header />);

        expect(screen.getByRole('heading', { name: 'Work items' })).toBeInTheDocument();
    });

    it('renders title-only header without action buttons', () => {
        render(<Header />);

        expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
    });

    it('renders workspace project controls on chat workspace route', () => {
        navigationMocks.pathname = '/orgs/org-1/projects/proj-1';

        render(<Header />);

        expect(screen.getByRole('heading', { name: 'Kitchen Renovation' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to projects' })).toHaveAttribute(
            'href',
            ROUTE_PATHS.OrgProjects('org-1'),
        );
        expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    });
});
