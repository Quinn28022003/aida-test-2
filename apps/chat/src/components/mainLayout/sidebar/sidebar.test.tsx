import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from './';

const profileMocks = vi.hoisted(() => ({
    data: {
        displayName: 'Alex Example Stone',
        email: 'alex@example.com',
    } as
        | {
              displayName?: string | null;
              email?: string | null;
          }
        | undefined,
}));

const authServiceMocks = vi.hoisted(() => ({
    signOut: vi.fn(() => new Promise<void>(() => undefined)),
}));

vi.mock('next/link', () => ({
    default: ({
        children,
        href,
        ...props
    }: {
        children: ReactNode;
        href: string;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
}));

vi.mock('@/hooks/profile', () => ({
    useProfile: () => ({
        data: profileMocks.data,
    }),
}));

vi.mock('@/lib/auth/session', () => ({
    useAuth: () => ({
        status: 'authenticated',
    }),
}));

vi.mock('@/services/auth.service', () => ({
    AuthService: {
        signOut: authServiceMocks.signOut,
    },
}));

describe('Sidebar', () => {
    beforeEach(() => {
        profileMocks.data = {
            displayName: 'Alex Example Stone',
            email: 'alex@example.com',
        };
        authServiceMocks.signOut.mockClear();
    });

    it('renders profile dropdown trigger in sidebar box', () => {
        render(<Sidebar />);

        expect(screen.getByRole('button', { name: 'Profile options' })).toBeInTheDocument();
    });

    it('builds initials from the first two words in the profile label', () => {
        profileMocks.data = {
            displayName: '  Alex   Example Stone  ',
            email: 'alex@example.com',
        };

        render(<Sidebar />);

        expect(screen.getByText('AE')).toBeInTheDocument();
    });

    it('falls back to question marks when the profile label is blank', () => {
        profileMocks.data = {
            displayName: '   ',
            email: '',
        };

        render(<Sidebar />);

        expect(screen.getByText('??')).toBeInTheDocument();
    });

    it('resolves work items link to the org picker route', () => {
        render(<Sidebar />);

        const workItemsLinks = screen.getAllByTitle('Work items');
        expect(workItemsLinks.length).toBeGreaterThan(0);
        for (const link of workItemsLinks) {
            expect(link).toHaveAttribute('href', '/orgs');
        }
    });
});
