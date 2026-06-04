import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Header } from './header';

const authServiceMocks = vi.hoisted(() => ({
    signOut: vi.fn(() => new Promise<void>(() => undefined)),
}));

const sessionMocks = vi.hoisted(() => ({
    status: 'authenticated' as 'authenticated' | 'loading',
}));

const profileMocks = vi.hoisted(() => ({
    displayName: 'Alex Example',
    email: 'alex@example.com',
}));

vi.mock('@aida/ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/ui')>();

    return {
        ...actual,
        Button: ({
            children,
            loadingDots,
            textLoading,
            ...props
        }: {
            children: ReactNode;
            loadingDots?: boolean;
            textLoading?: string;
        }) => <button {...props}>{loadingDots ? textLoading : children}</button>,
    };
});

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

vi.mock('@/services/auth.service', () => ({
    AuthService: {
        signOut: authServiceMocks.signOut,
    },
}));

describe('Header', () => {
    beforeEach(() => {
        sessionMocks.status = 'authenticated';
        profileMocks.displayName = 'Alex Example';
        profileMocks.email = 'alex@example.com';
        authServiceMocks.signOut.mockClear();
    });

    it('shows the signed-in user in the header', () => {
        render(<Header />);

        expect(screen.getByText('Alex Example')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    });

    it('shows a pending sign-out state while sign-out is running', async () => {
        render(<Header />);

        fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

        await waitFor(() => {
            expect(authServiceMocks.signOut).toHaveBeenCalledTimes(1);
            expect(screen.getByRole('button', { name: 'Signing out' })).toBeInTheDocument();
        });
    });

    it('shows a loading state while the session is loading', () => {
        sessionMocks.status = 'loading';

        render(<Header />);

        expect(screen.getByText('Loading session...')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    });
});
