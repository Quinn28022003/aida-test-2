import { describe, expect, it, vi } from 'vitest';

import { ProfileNotFoundError } from './profiles.errors';
import type { SupabaseProfilesRepository } from './repositories';
import { ProfileUseCaseService } from './services';
import type { ProfileServiceDependencies, ProfilesSupabaseClient } from './profiles.types';

const authUserId = 'aa0e8400-e29b-41d4-a716-446655440001';
const profileId = '770e8400-e29b-41d4-a716-446655440002';

const profileRow = {
  id: profileId,
  auth_user_id: authUserId,
  display_name: 'Quinn',
  email: 'user@example.com',
  avatar_url: null,
  timezone: 'Australia/Sydney',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const supabase = {} as ProfilesSupabaseClient;

function createRepository(overrides: Partial<SupabaseProfilesRepository> = {}): SupabaseProfilesRepository {
  return {
    getByAuthUserId: vi.fn().mockResolvedValue(null),
    ...overrides,
  } as SupabaseProfilesRepository;
}

function createDependencies(overrides: Partial<ProfileServiceDependencies> = {}): ProfileServiceDependencies {
  return {
    agentService: {
      listAgentMembershipsForUserId: vi.fn().mockResolvedValue([]),
      listAccessibleAgentsForUserId: vi.fn().mockResolvedValue([]),
      listConversationMembershipsForUserId: vi.fn().mockResolvedValue([]),
      listAccessibleConversationsForUserId: vi.fn().mockResolvedValue([]),
    },
    organizationService: {
      listMembershipsForUserId: vi.fn().mockResolvedValue([]),
      listOrganizationsForUserId: vi.fn().mockResolvedValue([]),
    },
    projectService: {
      listAccessibleJobsForUserId: vi.fn().mockResolvedValue([]),
      listAccessibleProjectsForUserId: vi.fn().mockResolvedValue([]),
      listJobMembershipsForUserId: vi.fn().mockResolvedValue([]),
      listProjectMembershipsForUserId: vi.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

describe('ProfileUseCaseService', () => {
  it('throws ProfileNotFoundError when no profile row exists', async () => {
    const repository = createRepository();
    const profileUseCases = new ProfileUseCaseService(supabase, repository, createDependencies());

    await expect(profileUseCases.getByAuthUserId({ authUserId })).rejects.toBeInstanceOf(ProfileNotFoundError);
    expect(repository.getByAuthUserId).toHaveBeenCalledWith({ client: supabase, authUserId });
  });

  it('returns camelCase ProfilesRow when a profile row exists', async () => {
    const repository = createRepository({
      getByAuthUserId: vi.fn().mockResolvedValue(profileRow),
    });
    const profileUseCases = new ProfileUseCaseService(supabase, repository, createDependencies());

    const result = await profileUseCases.getByAuthUserId({ authUserId });

    expect(repository.getByAuthUserId).toHaveBeenCalledWith({ client: supabase, authUserId });
    expect(result).toEqual({
      id: profileId,
      authUserId,
      displayName: 'Quinn',
      email: 'user@example.com',
      avatarUrl: null,
      timezone: 'Australia/Sydney',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('returns empty lists when the user has no memberships', async () => {
    const repository = createRepository({
      getByAuthUserId: vi.fn().mockResolvedValue(profileRow),
    });
    const dependencies = createDependencies();
    const profileUseCases = new ProfileUseCaseService(supabase, repository, dependencies);

    const result = await profileUseCases.getMeContext({ authUserId });

    expect(dependencies.organizationService.listMembershipsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(result).toEqual({
      organizations: [],
      projects: [],
      jobs: [],
      agents: [],
      conversations: [],
      memberships: {
        agents: [],
        conversations: [],
        organizations: [],
        projects: [],
        jobs: [],
      },
    });
  });

  it('returns existing context without creating data', async () => {
    const repository = createRepository({
      getByAuthUserId: vi.fn().mockResolvedValue(profileRow),
    });
    const dependencies = createDependencies({
      agentService: {
        listAgentMembershipsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440020',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            agentId: '550e8400-e29b-41d4-a716-446655440021',
            subjectType: 'user',
            subjectId: profileId,
            access: 'invoker',
            createdBy: profileId,
            revokedAt: null,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
        listAccessibleAgentsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440021',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            key: 'support',
            name: 'Support agent',
            description: null,
            status: 'active',
            visibility: 'restricted',
            activeVersionId: null,
            createdBy: profileId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          { id: '550e8400-e29b-41d4-a716-446655440031' },
        ]),
        listConversationMembershipsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440022',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            jobId: '550e8400-e29b-41d4-a716-446655440013',
            conversationId: '550e8400-e29b-41d4-a716-446655440023',
            subjectType: 'user',
            subjectId: profileId,
            accessLevel: 'editor',
            addedBy: profileId,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
        listAccessibleConversationsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440023',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            jobId: '550e8400-e29b-41d4-a716-446655440013',
            title: 'Support conversation',
            status: 'open',
            priority: 'normal',
            createdBy: profileId,
            primaryAgentId: '550e8400-e29b-41d4-a716-446655440021',
            metadata: {},
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          { id: '550e8400-e29b-41d4-a716-446655440033' },
        ]),
      },
      organizationService: {
        listMembershipsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            userId: profileId,
            memberType: 'internal',
            status: 'active',
            invitedBy: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
        listOrganizationsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            name: 'Demo org',
            slug: 'demo-org',
            plan: 'starter',
            dataRegion: 'default',
            defaultLocale: 'en-AU',
            createdBy: profileId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          { id: '550e8400-e29b-41d4-a716-446655440041' },
        ]),
      },
      projectService: {
        listAccessibleJobsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440013',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            customerProfileId: profileId,
            title: 'Active job',
            externalRef: null,
            metadata: {},
            status: 'open',
            createdBy: profileId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          { id: '550e8400-e29b-41d4-a716-446655440043' },
        ]),
        listAccessibleProjectsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440012',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            key: 'default',
            name: 'Default project',
            description: null,
            status: 'active',
            createdBy: profileId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
          { id: '550e8400-e29b-41d4-a716-446655440042' },
        ]),
        listJobMembershipsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440024',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            jobId: '550e8400-e29b-41d4-a716-446655440013',
            userId: profileId,
            memberKind: 'assignee',
            invitedBy: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
        listProjectMembershipsForUserId: vi.fn().mockResolvedValue([
          {
            id: '550e8400-e29b-41d4-a716-446655440025',
            orgId: '550e8400-e29b-41d4-a716-446655440011',
            projectId: '550e8400-e29b-41d4-a716-446655440012',
            userId: profileId,
            projectRole: 'admin',
            invitedBy: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      },
    });
    const profileUseCases = new ProfileUseCaseService(supabase, repository, dependencies);

    const result = await profileUseCases.getMeContext({ authUserId });

    expect(repository.getByAuthUserId).toHaveBeenCalledWith({ client: supabase, authUserId });
    expect(dependencies.projectService.listAccessibleProjectsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.projectService.listAccessibleJobsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.projectService.listProjectMembershipsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.projectService.listJobMembershipsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.agentService.listAgentMembershipsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.agentService.listAccessibleAgentsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.agentService.listConversationMembershipsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(dependencies.agentService.listAccessibleConversationsForUserId).toHaveBeenCalledWith({ userId: profileId });
    expect(result.organizations).toHaveLength(2);
    expect(result.projects).toHaveLength(2);
    expect(result.jobs).toHaveLength(2);
    expect(result.agents).toHaveLength(2);
    expect(result.conversations).toHaveLength(2);
    expect(result).not.toHaveProperty('activeOrg');
    expect(result).not.toHaveProperty('activeProject');
    expect(result).not.toHaveProperty('activeJob');
    expect(result).not.toHaveProperty('activeAgent');
    expect(result).not.toHaveProperty('activeConversation');
    expect(result.memberships.projects).toHaveLength(1);
    expect(result.memberships.jobs).toHaveLength(1);
    expect(result.memberships.agents).toHaveLength(1);
    expect(result.memberships.conversations).toHaveLength(1);
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('roles');
    expect(result).not.toHaveProperty('groups');
    expect(result).not.toHaveProperty('permissions');
    expect(result).not.toHaveProperty('switcherCandidates');
  });
});
