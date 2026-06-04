import { describe, expect, it, vi } from 'vitest';

import { OrganizationActorProfileNotFoundError } from './organizations.errors';
import { OrganizationUseCaseService } from './services';
import type { OrganizationsSupabaseClient } from './organizations.types';
import type { SupabaseOrganizationsRepository } from './repositories';

const supabase = {} as OrganizationsSupabaseClient;

function createRepository(
    overrides: Partial<SupabaseOrganizationsRepository> = {},
): SupabaseOrganizationsRepository {
    return {
        createOrganization: vi.fn().mockResolvedValue({
            id: 'org-1',
            name: 'Quinn organisation',
            slug: 'quinn',
            plan: 'starter',
            dataRegion: 'default',
            defaultLocale: 'en-AU',
            createdBy: 'user-1',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        }),
        bootstrapOrganization: vi.fn().mockResolvedValue({
            id: 'org-1',
            name: 'Quinn organisation',
            slug: 'quinn',
            plan: 'starter',
            dataRegion: 'default',
            defaultLocale: 'en-AU',
            createdBy: 'user-1',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        }),
        createOrganizationMember: vi.fn().mockResolvedValue({
            id: 'membership-1',
            orgId: 'org-1',
            userId: 'user-1',
            memberType: 'internal',
            status: 'active',
            invitedBy: 'user-1',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        }),
        getSystemRoleByKey: vi.fn().mockResolvedValue({
            id: 'role-owner',
            orgId: null,
            key: 'owner',
            name: 'Owner',
            description: 'Owner role',
            isSystem: true,
            createdAt: '2026-01-01T00:00:00Z',
        }),
        listRolesByOrgId: vi
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    id: 'role-owner',
                    orgId: 'org-1',
                    key: 'owner',
                    name: 'Owner',
                    description: 'Owner role',
                    isSystem: true,
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ]),
        insertRoles: vi.fn().mockResolvedValue(undefined),
        listRolePermissionsByRoleIds: vi.fn().mockResolvedValue([]),
        upsertRolePermissions: vi.fn().mockResolvedValue(undefined),
        createMemberRole: vi.fn().mockResolvedValue({
            orgId: 'org-1',
            userId: 'user-1',
            roleId: 'role-owner',
            assignedBy: 'user-1',
            createdAt: '2026-01-01T00:00:00Z',
        }),
        ...overrides,
    } as SupabaseOrganizationsRepository;
}

describe('OrganizationUseCaseService', () => {
    it('uses the user-scoped client for profile context reads', async () => {
        const repository = createRepository({
            listOrganizationMembershipsByUserId: vi.fn().mockResolvedValue([]),
            listOrganizationsByIds: vi.fn().mockResolvedValue([]),
        });
        const service = new OrganizationUseCaseService(
            supabase,
            repository,
        );

        await service.listMembershipsForUserId({ userId: 'user-1' });
        await service.listOrganizationsForUserId({ userId: 'user-1' });

        expect(repository.listOrganizationMembershipsByUserId).toHaveBeenCalledWith({
            client: supabase,
            userId: 'user-1',
        });
        expect(repository.listOrganizationsByIds).toHaveBeenCalledWith({ client: supabase, orgIds: [] });
    });

    it('bootstraps an organisation via RPC with the user-scoped client', async () => {
        const repository = createRepository({
            getProfileByAuthUserId: vi.fn().mockResolvedValue({
                id: 'user-1',
                authUserId: 'auth-user-1',
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
        });
        const service = new OrganizationUseCaseService(
            supabase,
            repository,
        );

        const result = await service.createOrganization({
            actorAuthUserId: 'auth-user-1',
            input: {
                name: 'Quinn organisation',
                slug: 'quinn',
            },
        });

        expect(repository.getProfileByAuthUserId).toHaveBeenCalledWith({
            client: supabase,
            authUserId: 'auth-user-1',
        });
        expect(repository.bootstrapOrganization).toHaveBeenCalledWith({
            client: supabase,
            input: expect.objectContaining({
                name: 'Quinn organisation',
                slug: 'quinn',
            }),
        });
        expect(repository.createOrganization).not.toHaveBeenCalled();
        expect(repository.getSystemRoleByKey).not.toHaveBeenCalled();
        expect(repository.createMemberRole).not.toHaveBeenCalled();
        expect(repository.createOrganizationMember).not.toHaveBeenCalled();
        expect(result.id).toBe('org-1');
    });

    it('updates an organisation by id', async () => {
        const repository = createRepository({
            getProfileByAuthUserId: vi.fn().mockResolvedValue({
                id: 'user-1',
                authUserId: 'auth-user-1',
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            getOrganizationById: vi.fn().mockResolvedValue({
                id: 'org-1',
                name: 'Quinn organisation',
                slug: 'quinn',
                plan: 'starter',
                dataRegion: 'default',
                defaultLocale: 'en-AU',
                createdBy: 'user-1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            getOrganizationMembershipByUserId: vi.fn().mockResolvedValue({
                id: 'membership-1',
                orgId: 'org-1',
                userId: 'user-1',
                memberType: 'internal',
                status: 'active',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            listDirectPermissionGrants: vi.fn().mockResolvedValue([]),
            listGroupIdsForUser: vi.fn().mockResolvedValue([]),
            listGroupRoleIds: vi.fn().mockResolvedValue([]),
            listGroupsByIds: vi.fn().mockResolvedValue([]),
            listMemberRolesForUser: vi.fn().mockResolvedValue([
                {
                    orgId: 'org-1',
                    userId: 'user-1',
                    roleId: 'role-owner',
                    assignedBy: 'user-1',
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ]),
            listRolePermissionsByRoleIds: vi.fn().mockResolvedValue(
                [{ roleId: 'role-owner', permissionKey: 'org.update' }],
            ),
            listRolesByIds: vi.fn().mockResolvedValue([
                {
                    id: 'role-owner',
                    orgId: 'org-1',
                    key: 'owner',
                    name: 'Owner',
                    description: 'Owner role',
                    isSystem: true,
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ]),
            updateOrganizationById: vi.fn().mockResolvedValue({
                id: 'org-1',
                name: 'Updated organisation',
                slug: 'quinn',
                plan: 'starter',
                dataRegion: 'default',
                defaultLocale: 'en-AU',
                createdBy: 'user-1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-02T00:00:00Z',
            }),
        });
        const service = new OrganizationUseCaseService(supabase, repository);

        const result = await service.updateOrganization({
            orgId: 'org-1',
            actorAuthUserId: 'auth-user-1',
            input: { name: 'Updated organisation' },
        });

        expect(repository.updateOrganizationById).toHaveBeenCalledWith({
            client: supabase,
            orgId: 'org-1',
            input: {
                name: 'Updated organisation',
                slug: undefined,
                dataRegion: undefined,
                defaultLocale: undefined,
            },
        });
        expect(result.name).toBe('Updated organisation');
    });

    it('deletes an organisation by id', async () => {
        const repository = createRepository({
            getProfileByAuthUserId: vi.fn().mockResolvedValue({
                id: 'user-1',
                authUserId: 'auth-user-1',
                displayName: 'Quinn',
                email: 'user@example.com',
                avatarUrl: null,
                timezone: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            getOrganizationById: vi.fn().mockResolvedValue({
                id: 'org-1',
                name: 'Quinn organisation',
                slug: 'quinn',
                plan: 'starter',
                dataRegion: 'default',
                defaultLocale: 'en-AU',
                createdBy: 'user-1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            getOrganizationMembershipByUserId: vi.fn().mockResolvedValue({
                id: 'membership-1',
                orgId: 'org-1',
                userId: 'user-1',
                memberType: 'internal',
                status: 'active',
                invitedBy: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
            listDirectPermissionGrants: vi.fn().mockResolvedValue([]),
            listGroupIdsForUser: vi.fn().mockResolvedValue([]),
            listGroupRoleIds: vi.fn().mockResolvedValue([]),
            listGroupsByIds: vi.fn().mockResolvedValue([]),
            listMemberRolesForUser: vi.fn().mockResolvedValue([
                {
                    orgId: 'org-1',
                    userId: 'user-1',
                    roleId: 'role-owner',
                    assignedBy: 'user-1',
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ]),
            listRolePermissionsByRoleIds: vi.fn().mockResolvedValue(
                [{ roleId: 'role-owner', permissionKey: 'org.delete' }],
            ),
            listRolesByIds: vi.fn().mockResolvedValue([
                {
                    id: 'role-owner',
                    orgId: 'org-1',
                    key: 'owner',
                    name: 'Owner',
                    description: 'Owner role',
                    isSystem: true,
                    createdAt: '2026-01-01T00:00:00Z',
                },
            ]),
            deleteOrganizationById: vi.fn().mockResolvedValue({
                id: 'org-1',
                name: 'Quinn organisation',
                slug: 'quinn',
                plan: 'starter',
                dataRegion: 'default',
                defaultLocale: 'en-AU',
                createdBy: 'user-1',
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            }),
        });
        const service = new OrganizationUseCaseService(supabase, repository);

        const result = await service.deleteOrganization({
            orgId: 'org-1',
            actorAuthUserId: 'auth-user-1',
        });

        expect(repository.deleteOrganizationById).toHaveBeenCalledWith({
            client: supabase,
            orgId: 'org-1',
        });
        expect(result.id).toBe('org-1');
    });

    it('fails with non-auth error when actor profile is missing for organisation creation', async () => {
        const repository = createRepository({
            getProfileByAuthUserId: vi.fn().mockResolvedValue(null),
        });
        const service = new OrganizationUseCaseService(
            supabase,
            repository,
        );

        await expect(
            service.createOrganization({
                actorAuthUserId: 'auth-user-missing',
                input: {
                    name: 'Quinn organisation',
                    slug: 'quinn',
                },
            }),
        ).rejects.toBeInstanceOf(OrganizationActorProfileNotFoundError);
    });
});
