import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { meContextQueryKey } from '@/constants/queryKeys';
import { useProfile } from '@/hooks/profile';
import { OrganizationService } from '@/services/organization.service';
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils';
import { useCreateOrganization } from './useCreateOrganization';

vi.mock('@/hooks/profile', () => ({
    useProfile: vi.fn(),
}));

vi.mock('@/services/organization.service', () => ({
    OrganizationService: {
        create: vi.fn(),
    },
}));

describe('useCreateOrganization', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.mocked(useProfile).mockReturnValue({
            data: {
                id: '00000000-0000-4000-8000-000000000001',
                displayName: 'Quinn',
                email: 'quinn@example.com',
            },
        } as ReturnType<typeof useProfile>);
        vi.mocked(OrganizationService.create).mockResolvedValue({
            id: '00000000-0000-4000-8000-000000000002',
            name: 'Quinn Organisation',
            slug: 'quinn-organisation-1234',
        } as Awaited<ReturnType<typeof OrganizationService.create>>);
    });

    it('creates a default organisation draft, invalidates me context, and calls onSuccess', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.123456);
        const queryClient = createTestQueryClient();
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useCreateOrganization({ onSuccess }), {
            wrapper: createQueryWrapper(queryClient),
        });

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(OrganizationService.create).toHaveBeenCalledWith({
            name: 'Quinn Organisation',
            slug: expect.stringMatching(/^quinn-organisation-[a-z0-9]{4}$/),
        });
        await waitFor(() => {
            expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: meContextQueryKey });
        });
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ name: 'Quinn Organisation' }));
    });
});
