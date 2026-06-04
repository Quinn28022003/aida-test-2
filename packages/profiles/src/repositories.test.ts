import { describe, expect, it, vi } from 'vitest';

import { SupabaseProfilesRepository } from './repositories';
import type { ProfilesSupabaseClient } from './profiles.types';

function createProfileQuery(result: unknown) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(result),
    };
}

describe('SupabaseProfilesRepository', () => {
    it('returns the parsed profile by auth user id', async () => {
        const profileRow = {
            id: '770e8400-e29b-41d4-a716-446655440002',
            auth_user_id: 'aa0e8400-e29b-41d4-a716-446655440001',
            display_name: 'Quinn',
            email: 'user@example.com',
            avatar_url: null,
            timezone: 'Australia/Sydney',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        };
        const query = createProfileQuery({
            data: profileRow,
            error: null,
        });
        const supabase = { from: vi.fn(() => query) };
        const repository = new SupabaseProfilesRepository();

        const result = await repository.getByAuthUserId({
            client: supabase as unknown as ProfilesSupabaseClient,
            authUserId: 'aa0e8400-e29b-41d4-a716-446655440001',
        });

        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(query.select).toHaveBeenCalledWith('*');
        expect(query.eq).toHaveBeenCalledWith(
            'auth_user_id',
            'aa0e8400-e29b-41d4-a716-446655440001',
        );
        expect(result).toEqual({
            id: '770e8400-e29b-41d4-a716-446655440002',
            authUserId: 'aa0e8400-e29b-41d4-a716-446655440001',
            displayName: 'Quinn',
            email: 'user@example.com',
            avatarUrl: null,
            timezone: 'Australia/Sydney',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        });
    });
});
