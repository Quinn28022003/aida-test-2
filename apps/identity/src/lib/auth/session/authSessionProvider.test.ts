import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { profileQueryKey } from '@/constants/queryKeys';
import { configureAuthSessionQueryClient } from '../utils/authSessionQuery';

import { AuthSessionProvider } from './authSessionProvider';
import { useAuth } from './useAuth';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

function AuthConsumer() {
    const auth = useAuth();

    return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'status' }, auth.status),
        auth.status === 'authenticated'
            ? createElement('span', { 'data-testid': 'auth-user-id' }, auth.authUserId)
            : null,
    );
}

function renderWithQueryClient(ui: ReturnType<typeof createElement>) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    configureAuthSessionQueryClient(queryClient);

    return {
        queryClient,
        ...render(createElement(QueryClientProvider, { client: queryClient }, ui)),
    };
}

describe('AuthSessionProvider', () => {
    it('exposes auth status from the Supabase session', async () => {
        const getSession = vi.fn().mockResolvedValue({
            data: {
                session: {
                    user: { id: 'user-1', email: 'user@example.com' },
                    access_token: 'token',
                },
            },
        });

        const supabase = {
            auth: {
                getSession,
                onAuthStateChange: vi.fn(() => ({
                    data: { subscription: { unsubscribe: vi.fn() } },
                })),
                signOut: vi.fn(),
            },
        } as const;

        renderWithQueryClient(
            createElement(
                AuthSessionProvider,
                { supabase: supabase as never },
                createElement(AuthConsumer),
            ),
        );

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
            expect(screen.getByTestId('auth-user-id')).toHaveTextContent('user-1');
        });
    });

    it('removes me query cache on SIGNED_OUT', async () => {
        let authListener: ((event: string, session: null) => void) | undefined;

        const getSession = vi.fn().mockResolvedValue({
            data: {
                session: {
                    user: { id: 'user-1', email: 'user@example.com' },
                    access_token: 'token',
                },
            },
        });

        const supabase = {
            auth: {
                getSession,
                onAuthStateChange: vi.fn((callback) => {
                    authListener = callback;
                    return { data: { subscription: { unsubscribe: vi.fn() } } };
                }),
                signOut: vi.fn(),
            },
        } as const;

        const { queryClient } = renderWithQueryClient(
            createElement(
                AuthSessionProvider,
                { supabase: supabase as never },
                createElement(AuthConsumer),
            ),
        );

        const removeQueries = vi.spyOn(queryClient, 'removeQueries');
        queryClient.setQueryData(profileQueryKey, { id: 'profile-1' });

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        });

        authListener?.('SIGNED_OUT', null);

        await waitFor(() => {
            expect(removeQueries).toHaveBeenCalledWith({ queryKey: profileQueryKey });
        });
    });
});
