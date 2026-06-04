import { describe, expect, it, vi } from 'vitest';

import { SupabaseOrganizationsRepository } from './repositories';
import type { OrganizationsSupabaseClient } from './organizations.types';

describe('SupabaseOrganizationsRepository', () => {
    it('calls bootstrap_organization RPC and parses the returned organisation', async () => {
        const rpc = vi.fn().mockResolvedValue({
            data: {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Acme Org',
                slug: 'acme-org',
                plan: 'starter',
                data_region: 'default',
                default_locale: 'en-AU',
                created_by: '33333333-3333-4333-8333-333333333333',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
            },
            error: null,
        });
        const supabase = { rpc };
        const repository = new SupabaseOrganizationsRepository();

        const result = await repository.bootstrapOrganization({
            client: supabase as unknown as OrganizationsSupabaseClient,
            input: {
                name: 'Acme Org',
                slug: 'acme-org',
                dataRegion: 'default',
                defaultLocale: 'en-AU',
            },
        });

        expect(rpc).toHaveBeenCalledWith('bootstrap_organization', {
            p_name: 'Acme Org',
            p_slug: 'acme-org',
            p_data_region: 'default',
            p_default_locale: 'en-AU',
        });
        expect(result.slug).toBe('acme-org');
    });

    it('throws when bootstrap_organization RPC returns an error', async () => {
        const rpcError = new Error('rpc failed');
        const rpc = vi.fn().mockResolvedValue({
            data: null,
            error: rpcError,
        });
        const supabase = { rpc };
        const repository = new SupabaseOrganizationsRepository();

        await expect(
            repository.bootstrapOrganization({
                client: supabase as unknown as OrganizationsSupabaseClient,
                input: {
                    name: 'Acme Org',
                    slug: 'acme-org',
                    dataRegion: 'default',
                    defaultLocale: 'en-AU',
                },
            }),
        ).rejects.toThrow(rpcError);
    });

    it('returns a global system role by key', async () => {
        const query = {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: '11111111-1111-4111-8111-111111111111',
                    org_id: null,
                    key: 'owner',
                    name: 'Owner',
                    description: 'Owner role',
                    is_system: true,
                    created_at: '2026-01-01T00:00:00Z',
                },
                error: null,
            }),
        };
        const supabase = {
            from: vi.fn(() => query),
        };
        const repository = new SupabaseOrganizationsRepository();

        const result = await repository.getSystemRoleByKey({
            client: supabase as unknown as OrganizationsSupabaseClient,
            roleKey: 'owner',
        });

        expect(supabase.from).toHaveBeenCalledWith('roles');
        expect(query.is).toHaveBeenCalledWith('org_id', null);
        expect(query.eq).toHaveBeenCalledWith('key', 'owner');
        expect(result?.id).toBe('11111111-1111-4111-8111-111111111111');
        expect(result?.orgId).toBeNull();
    });

    it('returns the organisation membership for an org and user', async () => {
        const membershipId = '11111111-1111-4111-8111-111111111111';
        const orgId = '22222222-2222-4222-8222-222222222222';
        const userId = '33333333-3333-4333-8333-333333333333';
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: membershipId,
                    org_id: orgId,
                    user_id: userId,
                    member_type: 'internal',
                    status: 'active',
                    invited_by: null,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z',
                },
                error: null,
            }),
        };
        const supabase = {
            from: vi.fn(() => query),
        };
        const repository = new SupabaseOrganizationsRepository();

        const result = await repository.getOrganizationMembershipByUserId({
            client: supabase as unknown as OrganizationsSupabaseClient,
            orgId,
            userId,
        });

        expect(supabase.from).toHaveBeenCalledWith('organization_members');
        expect(query.eq).toHaveBeenNthCalledWith(1, 'org_id', orgId);
        expect(query.eq).toHaveBeenNthCalledWith(2, 'user_id', userId);
        expect(result?.status).toBe('active');
        expect(result?.orgId).toBe(orgId);
    });
});
