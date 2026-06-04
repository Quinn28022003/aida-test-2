import { describe, expect, it, vi } from 'vitest';

import {
  AgentActorProfileNotFoundError,
  AgentInvitationNotFoundError,
  AgentMemberAlreadyExistsError,
  AgentMemberNotFoundError,
  AgentNotFoundError,
  AgentProjectNotFoundError,
} from './agents.errors';
import type { SupabaseAgentsRepository } from './repositories';
import { AgentUseCaseService } from './services';
import type { AgentsSupabaseClient } from './agents.types';

const supabase = {} as AgentsSupabaseClient;

const versionConfig = {
  instructions: 'You are helpful.',
  modelName: 'test-model',
};

function createRepository(overrides: Partial<SupabaseAgentsRepository> = {}): SupabaseAgentsRepository {
  return {
    getProfileByAuthUserId: vi.fn().mockResolvedValue({ id: 'profile-1' }),
    getProjectById: vi.fn().mockResolvedValue({ id: 'project-1', orgId: 'org-1' }),
    listAgents: vi.fn().mockResolvedValue([]),
    listAgentMembershipsByUserId: vi.fn().mockResolvedValue([]),
    listAgentsByIds: vi.fn().mockResolvedValue([]),
    listConversationMembershipsByUserId: vi.fn().mockResolvedValue([]),
    listConversationsByIds: vi.fn().mockResolvedValue([]),
    listProjectAgents: vi.fn().mockResolvedValue([]),
    getAgentById: vi.fn().mockResolvedValue(null),
    createAgent: vi.fn().mockResolvedValue({ id: 'agent-1', orgId: 'org-1', key: 'demo', name: 'Demo', status: 'draft' }),
    createProjectAgent: vi.fn().mockResolvedValue({ id: 'link-1' }),
    createAgentVersion: vi.fn().mockResolvedValue({ id: 'version-1', version: 1 }),
    updateAgentById: vi.fn().mockResolvedValue({ id: 'agent-1' }),
    deleteAgentById: vi.fn().mockResolvedValue(null),
    getAgentVersionById: vi.fn().mockResolvedValue(null),
    listAgentVersionsByAgentId: vi.fn().mockResolvedValue([]),
    updateAgentVersionById: vi.fn().mockResolvedValue({ id: 'version-1', status: 'archived' }),
    listAgentMembersByAgentId: vi.fn().mockResolvedValue([]),
    getAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue(null),
    createAgentMember: vi.fn().mockResolvedValue({ id: 'member-1' }),
    revokeAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue(null),
    reactivateAgentMemberById: vi.fn().mockResolvedValue({ id: 'member-1' }),
    listAgentInvitationsByAgentId: vi.fn().mockResolvedValue([]),
    getAgentInvitationById: vi.fn().mockResolvedValue(null),
    createAgentInvitation: vi.fn().mockResolvedValue({
      id: 'invite-1',
      tokenHash: 'hash',
      email: 'user@example.com',
    }),
    ...overrides,
  } as SupabaseAgentsRepository;
}

describe('AgentUseCaseService', () => {
  it('lists project-linked agents from the repository', async () => {
    const projectAgents = [
      {
        projectAgent: { id: 'link-1', projectId: 'project-1' },
        agent: { id: 'agent-1', name: 'Alpha Assistant' },
        activeVersion: { id: 'version-1', version: 1 },
      },
    ];
    const repository = createRepository({
      listProjectAgents: vi.fn().mockResolvedValue(projectAgents),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(service.listProjectAgents({ projectId: 'project-1' })).resolves.toEqual(projectAgents);
    expect(repository.listProjectAgents).toHaveBeenCalledWith({ client: supabase, projectId: 'project-1' });
  });

  it('gets an agent with active version and project links', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', name: 'Alpha Assistant' },
      activeVersion: { id: 'version-1', version: 1 },
      projectLinks: [{ id: 'link-1', projectId: 'project-1' }],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(service.getAgent({ agentId: 'agent-1' })).resolves.toEqual(agentDetail);
    expect(repository.getAgentById).toHaveBeenCalledWith({ client: supabase, agentId: 'agent-1' });
  });

  it('throws AgentNotFoundError when the agent does not exist', async () => {
    const repository = createRepository();
    const service = new AgentUseCaseService(supabase, repository);

    await expect(service.getAgent({ agentId: 'missing-agent' })).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('creates an agent linked to a project with an initial active version', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', name: 'Demo Agent' },
      activeVersion: { id: 'version-1', version: 1 },
      projectLinks: [{ id: 'link-1', projectId: 'project-1' }],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.createAgent({
        actorAuthUserId: 'auth-user-1',
        input: {
          projectId: 'project-1',
          key: 'demo-agent',
          name: 'Demo Agent',
          version: versionConfig,
        },
      }),
    ).resolves.toEqual(agentDetail);

    expect(repository.createAgent).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        orgId: 'org-1',
        key: 'demo-agent',
        status: 'active',
        createdBy: 'profile-1',
      }),
    });
    expect(repository.createProjectAgent).toHaveBeenCalled();
    expect(repository.createAgentVersion).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        orgId: 'org-1',
        agentId: 'agent-1',
        createdBy: 'profile-1',
      }),
    });
    expect(repository.updateAgentById).toHaveBeenCalledWith({
      client: supabase,
      agentId: 'agent-1',
      input: { activeVersionId: 'version-1' },
    });
  });

  it('throws AgentProjectNotFoundError when the project does not exist', async () => {
    const repository = createRepository({
      getProjectById: vi.fn().mockResolvedValue(null),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.createAgent({
        actorAuthUserId: 'auth-user-1',
        input: {
          projectId: 'missing-project',
          key: 'demo-agent',
          name: 'Demo Agent',
          version: {
            instructions: 'You are helpful.',
            modelName: 'test-model',
          },
        },
      }),
    ).rejects.toBeInstanceOf(AgentProjectNotFoundError);
  });

  it('throws AgentActorProfileNotFoundError when the actor profile is missing', async () => {
    const repository = createRepository({
      getProfileByAuthUserId: vi.fn().mockResolvedValue(null),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.createAgent({
        actorAuthUserId: 'missing-auth-user',
        input: {
          projectId: 'project-1',
          key: 'demo-agent',
          name: 'Demo Agent',
          version: {
            instructions: 'You are helpful.',
            modelName: 'test-model',
          },
        },
      }),
    ).rejects.toBeInstanceOf(AgentActorProfileNotFoundError);
  });

  it('updates an agent, publishes a new version, and returns the refreshed detail', async () => {
    const initialDetail = {
      agent: { id: 'agent-1', orgId: 'org-1', name: 'Alpha Assistant' },
      activeVersion: { id: 'version-1', version: 1 },
      projectLinks: [],
    };
    const updatedDetail = {
      agent: { id: 'agent-1', name: 'Updated Agent' },
      activeVersion: { id: 'version-2', version: 2 },
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi
        .fn()
        .mockResolvedValueOnce(initialDetail)
        .mockResolvedValueOnce(updatedDetail),
      createAgentVersion: vi.fn().mockResolvedValue({ id: 'version-2', version: 2 }),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.updateAgent({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { name: 'Updated Agent', version: versionConfig },
      }),
    ).resolves.toEqual(updatedDetail);

    expect(repository.updateAgentById).toHaveBeenCalledWith({
      client: supabase,
      agentId: 'agent-1',
      input: { name: 'Updated Agent' },
    });
    expect(repository.createAgentVersion).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        agentId: 'agent-1',
        createdBy: 'profile-1',
      }),
    });
    expect(repository.updateAgentVersionById).toHaveBeenCalledWith({
      client: supabase,
      agentId: 'agent-1',
      versionId: 'version-1',
      input: { status: 'archived' },
    });
  });

  it('deletes an agent and returns the last known detail', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', name: 'Demo Agent' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      deleteAgentById: vi.fn().mockResolvedValue({ id: 'agent-1' }),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.deleteAgent({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
      }),
    ).resolves.toEqual(agentDetail);
  });

  it('lists all agent versions for an agent', async () => {
    const versions = [
      { id: 'version-2', agentId: 'agent-1', version: 2, status: 'active' },
      { id: 'version-1', agentId: 'agent-1', version: 1, status: 'archived' },
    ];
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: versions[0],
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      listAgentVersionsByAgentId: vi.fn().mockResolvedValue(versions),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(service.listAgentVersions({ agentId: 'agent-1' })).resolves.toEqual(versions);
    expect(repository.listAgentVersionsByAgentId).toHaveBeenCalledWith({
      client: supabase,
      agentId: 'agent-1',
    });
  });

  it('lists active agent members for an agent', async () => {
    const members = [{ id: 'member-1', agentId: 'agent-1', revokedAt: null }];
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      listAgentMembersByAgentId: vi.fn().mockResolvedValue(members),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(service.listAgentMembers({ agentId: 'agent-1' })).resolves.toEqual(members);
  });

  it('adds a new agent member', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const createdMember = { id: 'member-1', agentId: 'agent-1', subjectId: 'user-2' };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      getAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue(null),
      createAgentMember: vi.fn().mockResolvedValue(createdMember),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.addAgentMember({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { userId: 'user-2', access: 'invoker' },
      }),
    ).resolves.toEqual(createdMember);
  });

  it('reactivates a revoked agent member', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const reactivatedMember = { id: 'member-1', agentId: 'agent-1', revokedAt: null };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      getAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue({
        id: 'member-1',
        revokedAt: '2026-01-01T00:00:00.000Z',
      }),
      reactivateAgentMemberById: vi.fn().mockResolvedValue(reactivatedMember),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.addAgentMember({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { userId: 'user-2', access: 'manager' },
      }),
    ).resolves.toEqual(reactivatedMember);
  });

  it('throws AgentMemberAlreadyExistsError when adding an active member', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      getAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue({
        id: 'member-1',
        revokedAt: null,
      }),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.addAgentMember({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { userId: 'user-2', access: 'invoker' },
      }),
    ).rejects.toBeInstanceOf(AgentMemberAlreadyExistsError);
  });

  it('revokes an agent member', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const revokedMember = { id: 'member-1', revokedAt: '2026-01-02T00:00:00.000Z' };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      revokeAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue(revokedMember),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.revokeAgentMember({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { userId: 'user-2' },
      }),
    ).resolves.toEqual(revokedMember);
  });

  it('throws AgentMemberNotFoundError when revoking a missing member', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      revokeAgentMemberByAgentAndUserId: vi.fn().mockResolvedValue(null),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.revokeAgentMember({
        agentId: 'agent-1',
        actorAuthUserId: 'auth-user-1',
        input: { userId: 'user-2' },
      }),
    ).rejects.toBeInstanceOf(AgentMemberNotFoundError);
  });

  it('creates an agent invitation and returns the accept token', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      createAgentInvitation: vi.fn().mockResolvedValue({
        id: 'invite-1',
        orgId: 'org-1',
        agentId: 'agent-1',
        email: 'user@example.com',
        access: 'invoker',
        tokenHash: 'stored-hash',
        status: 'pending',
        expiresAt: '2026-06-01T00:00:00.000Z',
        invitedBy: 'profile-1',
        acceptedBy: null,
        acceptedAt: null,
        revokedAt: null,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      }),
    });
    const service = new AgentUseCaseService(supabase, repository);

    const result = await service.createAgentInvitation({
      agentId: 'agent-1',
      actorAuthUserId: 'auth-user-1',
      input: { email: '  User@Example.com ', access: 'invoker' },
    });

    expect(result.invitation).not.toHaveProperty('tokenHash');
    expect(result.invitation.email).toBe('user@example.com');
    expect(result.token).toEqual(expect.any(String));
    expect(result.token.length).toBeGreaterThan(0);
    expect(repository.createAgentInvitation).toHaveBeenCalledWith({
      client: supabase,
      input: expect.objectContaining({
        orgId: 'org-1',
        agentId: 'agent-1',
        email: 'user@example.com',
        invitedBy: 'profile-1',
      }),
    });
  });

  it('throws AgentInvitationNotFoundError when the invitation does not exist', async () => {
    const agentDetail = {
      agent: { id: 'agent-1', orgId: 'org-1' },
      activeVersion: null,
      projectLinks: [],
    };
    const repository = createRepository({
      getAgentById: vi.fn().mockResolvedValue(agentDetail),
      getAgentInvitationById: vi.fn().mockResolvedValue(null),
    });
    const service = new AgentUseCaseService(supabase, repository);

    await expect(
      service.getAgentInvitation({ agentId: 'agent-1', invitationId: 'missing-invite' }),
    ).rejects.toBeInstanceOf(AgentInvitationNotFoundError);
  });
});
