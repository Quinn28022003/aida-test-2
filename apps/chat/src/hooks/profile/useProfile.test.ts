import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createQueryWrapper } from '@/test/test-utils';

const useAuthMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
    useAuth: () => useAuthMock(),
}));

vi.mock('@/services/user.service', () => ({
    UserService: {
        getProfileByAuthUserId: vi.fn(),
    },
}));

const authUserId = '00000000-0000-4000-8000-000000000001';

function createWrapper() {
    const QueryWrapper = createQueryWrapper();

    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryWrapper, null, children);
    };
}

describe('useProfile', () => {
    it('deduplicates profile requests when used in multiple hooks', async () => {
        const { UserService } = await import('@/services/user.service');
        const getProfileByAuthUserIdMock = vi.mocked(UserService.getProfileByAuthUserId);

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
        const { UserService } = await import('@/services/user.service');
        const getProfileByAuthUserIdMock = vi.mocked(UserService.getProfileByAuthUserId);

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
