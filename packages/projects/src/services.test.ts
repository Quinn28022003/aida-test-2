import { describe, expect, it, vi } from 'vitest';

import { ProjectActorProfileNotFoundError } from './projects.errors';
import type { SupabaseProjectsRepository } from './repositories';
import { ProjectUseCaseService } from './services';
import type { ProjectsSupabaseClient } from './projects.types';

const supabase = {} as ProjectsSupabaseClient;

function createRepository(overrides: Partial<SupabaseProjectsRepository> = {}): SupabaseProjectsRepository {
  return {
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
    getProjectById: vi.fn().mockResolvedValue({
      id: 'project-1',
      orgId: 'org-1',
      key: 'demo',
      name: 'Demo',
      description: null,
      status: 'active',
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    listProjectsByIds: vi.fn().mockResolvedValue([]),
    getOrganizationMembership: vi.fn().mockResolvedValue({
      id: 'membership-1',
      orgId: 'org-1',
      userId: 'user-1',
      memberType: 'internal',
      status: 'active',
      invitedBy: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    listMemberRolesForUser: vi.fn().mockResolvedValue([{ roleId: 'role-1' }]),
    listGroupIdsForUser: vi.fn().mockResolvedValue([]),
    listGroupsByIds: vi.fn().mockResolvedValue([]),
    listGroupRoleIds: vi.fn().mockResolvedValue([]),
    listRolesByIds: vi.fn().mockResolvedValue([
      {
        id: 'role-1',
        orgId: 'org-1',
        key: 'owner',
        name: 'Owner',
        description: null,
        isSystem: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]),
    listRolePermissionsByRoleIds: vi.fn().mockResolvedValue([{ roleId: 'role-1', permissionKey: 'job.create' }]),
    listDirectPermissionGrants: vi.fn().mockResolvedValue([]),
    getProjectMemberByUserId: vi.fn().mockResolvedValue({
      id: 'project-member-1',
      orgId: 'org-1',
      projectId: 'project-1',
      userId: 'user-1',
      projectRole: 'member',
      invitedBy: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    listJobMembershipsByUserId: vi.fn().mockResolvedValue([]),
    listJobsByIds: vi.fn().mockResolvedValue([]),
    listJobsByProjectId: vi.fn().mockResolvedValue([]),
    createJob: vi.fn().mockResolvedValue({
      id: 'job-1',
      orgId: 'org-1',
      projectId: 'project-1',
      customerProfileId: 'customer-1',
      title: 'New job',
      externalRef: null,
      status: 'todo',
      metadata: {},
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
    ...overrides,
  } as SupabaseProjectsRepository;
}

describe('ProjectUseCaseService', () => {
  it('uses the user-scoped client for profile context reads', async () => {
    const repository = createRepository({
      listJobsByIds: vi.fn().mockResolvedValue([]),
      listJobsByProjectId: vi.fn().mockResolvedValue([]),
      listProjectMembershipsByUserId: vi.fn().mockResolvedValue([
        {
          id: 'project-member-1',
          orgId: 'org-1',
          projectId: 'project-1',
          userId: 'user-1',
          projectRole: 'owner',
          invitedBy: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ]),
      listRolePermissionsByRoleIds: vi.fn().mockResolvedValue([{ roleId: 'role-1', permissionKey: 'job.read' }]),
    });
    const service = new ProjectUseCaseService(supabase, repository);

    await service.listProjectMembershipsForUserId({ userId: 'user-1', orgId: 'org-1' });
    await service.listAccessibleProjectsForUserId({ userId: 'user-1', orgId: 'org-1' });
    await service.listJobMembershipsForUserId({ userId: 'user-1', projectId: 'project-1' });
    await service.listAccessibleJobsForUserId({ userId: 'user-1', projectId: 'project-1' });

    expect(repository.listProjectMembershipsByUserId).toHaveBeenCalledWith({
      client: supabase,
      userId: 'user-1',
      orgId: 'org-1',
    });
    expect(repository.listProjectsByIds).toHaveBeenCalledWith({ client: supabase, projectIds: ['project-1'] });
    expect(repository.getProjectById).toHaveBeenCalledWith({ client: supabase, projectId: 'project-1' });
    expect(repository.listJobsByProjectId).toHaveBeenCalledWith({ client: supabase, projectId: 'project-1' });
  });

  it('lists accessible jobs from direct job memberships when no project is selected', async () => {
    const repository = createRepository({
      listJobMembershipsByUserId: vi
        .fn()
        .mockResolvedValue([{ jobId: 'job-1' }, { jobId: 'job-1' }, { jobId: 'job-2' }]),
      listJobsByIds: vi.fn().mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]),
    });
    const service = new ProjectUseCaseService(supabase, repository);

    await expect(service.listAccessibleJobsForUserId({ userId: 'user-1' })).resolves.toEqual([{ id: 'job-1' }, { id: 'job-2' }]);
    expect(repository.listJobMembershipsByUserId).toHaveBeenCalledWith({ client: supabase, userId: 'user-1' });
    expect(repository.listJobsByIds).toHaveBeenCalledWith({ client: supabase, jobIds: ['job-1', 'job-2'] });
    expect(repository.getProjectById).not.toHaveBeenCalled();
  });

  it('creates a job without requiring project manager permission checks', async () => {
    const repository = createRepository();
    const service = new ProjectUseCaseService(supabase, repository);

    await expect(
      service.createJob({
        projectId: 'project-1',
        actorAuthUserId: 'auth-user-1',
        input: {
          customerProfileId: 'customer-1',
          title: 'New job',
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'job-1',
        projectId: 'project-1',
        title: 'New job',
      }),
    );
    expect(repository.createJob).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        customerProfileId: 'customer-1',
        projectId: 'project-1',
        orgId: 'org-1',
        createdBy: 'user-1',
        title: 'New job',
      }),
    });
  });

  it('passes project member role through without service fallback', async () => {
    const repository = createRepository({
      createProjectMember: vi.fn().mockResolvedValue({
        id: 'project-member-2',
        orgId: 'org-1',
        projectId: 'project-1',
        userId: 'user-2',
        projectRole: undefined,
        invitedBy: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    });
    const service = new ProjectUseCaseService(supabase, repository);

    await service.addMember({
      projectId: 'project-1',
      actorAuthUserId: 'auth-user-1',
      input: {
        userId: 'user-2',
        projectRole: undefined,
      },
    });

    expect(repository.createProjectMember).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        userId: 'user-2',
        projectRole: undefined,
      }),
    });
  });

  it('lists job members after confirming the job belongs to the project', async () => {
    const repository = createRepository({
      getJobById: vi.fn().mockResolvedValue({
        id: 'job-1',
        orgId: 'org-1',
        projectId: 'project-1',
        customerProfileId: 'customer-1',
        title: 'Job',
        externalRef: null,
        status: 'open',
        metadata: {},
        createdBy: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      listJobMembersByJobId: vi.fn().mockResolvedValue([
        {
          id: 'job-member-1',
          orgId: 'org-1',
          projectId: 'project-1',
          jobId: 'job-1',
          userId: 'user-1',
          memberKind: 'internal',
          invitedBy: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    });
    const service = new ProjectUseCaseService(supabase, repository);

    await expect(
      service.listJobMembers({
        projectId: 'project-1',
        jobId: 'job-1',
        actorAuthUserId: 'auth-user-1',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'job-member-1',
        jobId: 'job-1',
      }),
    ]);
    expect(repository.listJobMembersByJobId).toHaveBeenCalledWith({
      client: supabase,
      projectId: 'project-1',
      jobId: 'job-1',
    });
  });

  it('fails with non-auth error when actor profile is missing for job creation', async () => {
    const repository = createRepository({
      getProfileByAuthUserId: vi.fn().mockResolvedValue(null),
    });
    const service = new ProjectUseCaseService(supabase, repository);

    await expect(
      service.createJob({
        projectId: 'project-1',
        actorAuthUserId: 'auth-user-missing',
        input: {
          customerProfileId: 'customer-1',
          title: 'New job',
        },
      }),
    ).rejects.toBeInstanceOf(ProjectActorProfileNotFoundError);
  });
});
