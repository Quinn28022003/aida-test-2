import { describe, expect, it, vi } from 'vitest';

import { SupabaseProjectsRepository } from './repositories';
import type { ProjectsSupabaseClient } from './projects.types';

describe('SupabaseProjectsRepository', () => {
    it('returns a camelCase project row by project id', async () => {
        const projectId = '11111111-1111-4111-8111-111111111111';
        const orgId = '22222222-2222-4222-8222-222222222222';
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: projectId,
                    org_id: orgId,
                    key: 'demo',
                    name: 'Demo project',
                    description: null,
                    status: 'active',
                    created_by: null,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z',
                },
                error: null,
            }),
        };
        const supabase = {
            from: vi.fn(() => query),
        };
        const repository = new SupabaseProjectsRepository();

        const result = await repository.getProjectById({
            client: supabase as unknown as ProjectsSupabaseClient,
            projectId,
        });

        expect(supabase.from).toHaveBeenCalledWith('projects');
        expect(query.eq).toHaveBeenCalledWith('id', projectId);
        expect(result?.orgId).toBe(orgId);
        expect(result?.name).toBe('Demo project');
    });
});
