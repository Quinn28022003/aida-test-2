import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from './sidebar';

const sessionMocks = vi.hoisted(() => ({
    status: 'authenticated' as 'authenticated' | 'loading',
}));

const profileMocks = vi.hoisted(() => ({
    displayName: 'Alex Example',
    email: 'alex@example.com',
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

vi.mock('@/hooks/useProfile', () => ({
    useProfile: () => ({
        data: {
            displayName: profileMocks.displayName,
            email: profileMocks.email,
        },
    }),
}));

vi.mock('@/lib/auth/session', () => ({
    useAuth: () => ({
        status: sessionMocks.status,
    }),
}));

describe('Sidebar', () => {
    beforeEach(() => {
        sessionMocks.status = 'authenticated';
        profileMocks.displayName = 'Alex Example';
        profileMocks.email = 'alex@example.com';
    });

    it('shows the signed-in profile details', () => {
        render(<Sidebar />);

        expect(screen.getByText('Alex Example')).toBeInTheDocument();
        expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    });

    it('shows a loading state while the session is loading', () => {
        sessionMocks.status = 'loading';

        render(<Sidebar />);

        expect(screen.getByText('Loading session...')).toBeInTheDocument();
    });
});
