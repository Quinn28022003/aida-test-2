import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { configureAuthSessionQueryClient } from '@/lib/auth/authSessionQuery';

const useAuthMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
    useAuth: () => useAuthMock(),
}));

vi.mock('@/services/profiles.service', () => ({
    ProfilesService: {
        getByAuthUserId: vi.fn(),
    },
}));

const authUserId = '00000000-0000-4000-8000-000000000001';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    configureAuthSessionQueryClient(queryClient);

    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useProfile', () => {
    it('deduplicates profile requests when used in multiple hooks', async () => {
        const { ProfilesService } = await import('@/services/profiles.service');
        const getProfileByAuthUserIdMock = vi.mocked(ProfilesService.getByAuthUserId);

        getProfileByAuthUserIdMock.mockResolvedValue({
            authUserId,
            id: '00000000-0000-4000-8000-000000000002',
            email: 'user@example.com',
            displayName: 'Quinn',
            avatarUrl: null,
            timezone: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        });

        useAuthMock.mockReturnValue({ status: 'authenticated', authUserId });

        const { useProfile } = await import('./useProfile');
        const wrapper = createWrapper();

        renderHook(() => useProfile(), { wrapper });
        renderHook(() => useProfile(), { wrapper });

        await waitFor(() => {
            expect(getProfileByAuthUserIdMock).toHaveBeenCalledTimes(1);
            expect(getProfileByAuthUserIdMock).toHaveBeenCalledWith(authUserId);
        });
    });

    it('does not fetch when session is unauthenticated', async () => {
        const { ProfilesService } = await import('@/services/profiles.service');
        const getProfileByAuthUserIdMock = vi.mocked(ProfilesService.getByAuthUserId);

        getProfileByAuthUserIdMock.mockClear();
        useAuthMock.mockReturnValue({ status: 'unauthenticated' });

        const { useProfile } = await import('./useProfile');
        const wrapper = createWrapper();

        renderHook(() => useProfile(), { wrapper });

        await waitFor(() => {
            expect(getProfileByAuthUserIdMock).not.toHaveBeenCalled();
        });
    });
});
