import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMeContext } from '@/hooks/me';
import { OrganizationService } from '@/services/organization.service';
import { createQueryWrapper } from '@/test/test-utils';
import { useOrgProjects } from './useOrgProjects';

vi.mock('@/hooks/me', () => ({
    useMeContext: vi.fn(),
}));

vi.mock('@/services/organization.service', () => ({
    OrganizationService: {
        listProjects: vi.fn(),
    },
}));

const orgId = '00000000-0000-4000-8000-000000000001';
const visibleProjectId = '00000000-0000-4000-8000-000000000002';
const hiddenProjectId = '00000000-0000-4000-8000-000000000003';

describe('useOrgProjects', () => {
    beforeEach(() => {
        vi.mocked(OrganizationService.listProjects).mockReset();
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: true,
            scoped: {
                isExternalUser: false,
                organizations: [],
                projects: [],
                jobs: [],
                canManageBilling: true,
            },
        } as ReturnType<typeof useMeContext>);
    });

    it('filters projects for external users', async () => {
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: true,
            scoped: {
                isExternalUser: true,
                organizations: [],
                projects: [{ id: visibleProjectId }],
                jobs: [],
                canManageBilling: false,
            },
        } as ReturnType<typeof useMeContext>);
        vi.mocked(OrganizationService.listProjects).mockResolvedValue([
            { id: visibleProjectId, name: 'Visible' },
            { id: hiddenProjectId, name: 'Hidden' },
        ] as Awaited<ReturnType<typeof OrganizationService.listProjects>>);

        const { result } = renderHook(() => useOrgProjects(orgId), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => expect(result.current.projects.map((project) => project.id)).toEqual([visibleProjectId]));
    });

    it('returns an empty projects fallback before data is loaded', () => {
        vi.mocked(useMeContext).mockReturnValue({
            isSuccess: false,
            scoped: null,
        } as ReturnType<typeof useMeContext>);

        const { result } = renderHook(() => useOrgProjects(orgId), {
            wrapper: createQueryWrapper(),
        });

        expect(result.current.projects).toEqual([]);
        expect(OrganizationService.listProjects).not.toHaveBeenCalled();
    });
});
