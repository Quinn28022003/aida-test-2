import { createHash, randomBytes } from 'node:crypto';

import type {
  TAgentCreateParams,
  TAgentDeleteParams,
  TAgentInvitationCreateParams,
  TAgentInvitationParams,
  TAgentMemberCreateParams,
  TAgentMemberRevokeParams,
  TAgentParams,
  TAgentUpdateParams,
  TAgentUserParams,
  TAgentVersionCreateInput,
  TAgentsRepositoryUpdateAgentInput,
  TProjectAgentsParams,
} from '@aida/contracts';

import {
  AgentActorProfileNotFoundError,
  AgentInvitationNotFoundError,
  AgentMemberAlreadyExistsError,
  AgentMemberNotFoundError,
  AgentNotFoundError,
  AgentProjectNotFoundError,
} from './agents.errors';
import type { AgentUseCaseServiceType, AgentsRepository, AgentsSupabaseClient } from './agents.types';

/** Returns the unique string values while preserving their first-seen order. */
function dedupe(values: readonly string[]) {
  return [...new Set(values)];
}

export class AgentUseCaseService implements AgentUseCaseServiceType {
  constructor(
    private readonly supabase: AgentsSupabaseClient,
    private readonly repository: AgentsRepository,
  ) {}

  private async getActorProfileId(actorAuthUserId: string) {
    const actorProfile = await this.repository.getProfileByAuthUserId({
      client: this.supabase,
      authUserId: actorAuthUserId,
    });

    if (!actorProfile) {
      throw new AgentActorProfileNotFoundError(actorAuthUserId);
    }

    return actorProfile.id;
  }

  /** Lists agents visible to the current session. */
  async listAgents() {
    return this.repository.listAgents({ client: this.supabase });
  }

  /** Lists all agent memberships for a profile user id, including revoked memberships. */
  async listAgentMembershipsForUserId({ userId }: TAgentUserParams) {
    return this.repository.listAgentMembershipsByUserId({ client: this.supabase, userId });
  }

  /** Lists agents the profile can currently access through active memberships. */
  async listAccessibleAgentsForUserId({ userId }: TAgentUserParams) {
    const memberships = await this.repository.listAgentMembershipsByUserId({ client: this.supabase, userId });
    const agentIds = dedupe(
      memberships.filter((membership) => membership.revokedAt === null).map((membership) => membership.agentId),
    );

    return this.repository.listAgentsByIds({ client: this.supabase, agentIds });
  }

  /** Lists all conversation memberships for a profile user id. */
  async listConversationMembershipsForUserId({ userId }: TAgentUserParams) {
    return this.repository.listConversationMembershipsByUserId({ client: this.supabase, userId });
  }

  /** Lists conversations the profile can access through conversation memberships. */
  async listAccessibleConversationsForUserId({ userId }: TAgentUserParams) {
    const memberships = await this.repository.listConversationMembershipsByUserId({ client: this.supabase, userId });

    return this.repository.listConversationsByIds({
      client: this.supabase,
      conversationIds: dedupe(memberships.map((membership) => membership.conversationId)),
    });
  }

  /** Lists agents linked to a project with active version config when present. */
  async listProjectAgents({ projectId }: TProjectAgentsParams) {
    return this.repository.listProjectAgents({ client: this.supabase, projectId });
  }

  /** Fetches one agent with active version and project links. */
  async getAgent({ agentId }: TAgentParams) {
    const agent = await this.repository.getAgentById({ client: this.supabase, agentId });

    if (!agent) {
      throw new AgentNotFoundError(agentId);
    }

    return agent;
  }

  private async publishNextAgentVersion({
    agentId,
    orgId,
    actorProfileId,
    versionConfig,
    previousActiveVersionId,
  }: {
    agentId: string;
    orgId: string;
    actorProfileId: string;
    versionConfig: TAgentVersionCreateInput;
    previousActiveVersionId: string | null;
  }) {
    const created = await this.repository.createAgentVersion({
      client: this.supabase,
      input: {
        orgId,
        agentId,
        status: 'active',
        instructions: versionConfig.instructions,
        modelName: versionConfig.modelName,
        modelProvider: versionConfig.modelProvider,
        modelProfile: versionConfig.modelProfile,
        temperature: versionConfig.temperature,
        maxOutputTokens: versionConfig.maxOutputTokens,
        responsePolicy: versionConfig.responsePolicy,
        memoryPolicy: versionConfig.memoryPolicy,
        ragPolicy: versionConfig.ragPolicy,
        toolPolicy: versionConfig.toolPolicy,
        createdBy: actorProfileId,
      },
    });

    await this.repository.updateAgentById({
      client: this.supabase,
      agentId,
      input: {
        activeVersionId: created.id,
      },
    });

    if (previousActiveVersionId) {
      await this.repository.updateAgentVersionById({
        client: this.supabase,
        agentId,
        versionId: previousActiveVersionId,
        input: { status: 'archived' },
      });
    }

    return created;
  }

  /** Creates an agent, links it to a project, and seeds the first active version. */
  async createAgent({ actorAuthUserId, input }: TAgentCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const project = await this.repository.getProjectById({ client: this.supabase, projectId: input.projectId });

    if (!project) {
      throw new AgentProjectNotFoundError(input.projectId);
    }

    const agent = await this.repository.createAgent({
      client: this.supabase,
      input: {
        orgId: project.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        status: 'active',
        createdBy: actorProfileId,
      },
    });

    await this.repository.createProjectAgent({
      client: this.supabase,
      input: {
        orgId: project.orgId,
        projectId: input.projectId,
        agentId: agent.id,
        visibility: input.visibility ?? 'restricted',
      },
    });

    await this.publishNextAgentVersion({
      agentId: agent.id,
      orgId: project.orgId,
      actorProfileId,
      versionConfig: input.version,
      previousActiveVersionId: null,
    });

    return this.getAgent({ agentId: agent.id });
  }

  /** Updates an agent by id and publishes a new active version. */
  async updateAgent({ agentId, actorAuthUserId, input }: TAgentUpdateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const detail = await this.getAgent({ agentId });
    const patch: TAgentsRepositoryUpdateAgentInput = {};

    if (input.key !== undefined) {
      patch.key = input.key;
    }

    if (input.name !== undefined) {
      patch.name = input.name;
    }

    if (input.description !== undefined) {
      patch.description = input.description;
    }

    if (input.status !== undefined) {
      patch.status = input.status;
    }

    if (Object.keys(patch).length > 0) {
      await this.repository.updateAgentById({
        client: this.supabase,
        agentId,
        input: patch,
      });
    }

    await this.publishNextAgentVersion({
      agentId,
      orgId: detail.agent.orgId,
      actorProfileId,
      versionConfig: input.version,
      previousActiveVersionId: detail.activeVersion?.id ?? null,
    });

    return this.getAgent({ agentId });
  }

  /** Lists all versions for an agent, newest version number first. */
  async listAgentVersions({ agentId }: TAgentParams) {
    await this.getAgent({ agentId });

    return this.repository.listAgentVersionsByAgentId({ client: this.supabase, agentId });
  }

  /** Deletes an agent by id. */
  async deleteAgent({ agentId, actorAuthUserId }: TAgentDeleteParams) {
    void actorAuthUserId;

    const existing = await this.getAgent({ agentId });
    const deleted = await this.repository.deleteAgentById({ client: this.supabase, agentId });

    if (!deleted) {
      throw new AgentNotFoundError(agentId);
    }

    return existing;
  }

  /** Lists active agent members for an agent. */
  async listAgentMembers({ agentId }: TAgentParams) {
    await this.getAgent({ agentId });

    return this.repository.listAgentMembersByAgentId({ client: this.supabase, agentId });
  }

  /** Grants agent access to a user or reactivates a revoked membership. */
  async addAgentMember({ agentId, actorAuthUserId, input }: TAgentMemberCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const { agent } = await this.getAgent({ agentId });
    const existing = await this.repository.getAgentMemberByAgentAndUserId({
      client: this.supabase,
      agentId,
      userId: input.userId,
    });

    if (existing?.revokedAt === null) {
      throw new AgentMemberAlreadyExistsError(agentId, input.userId);
    }

    if (existing) {
      return this.repository.reactivateAgentMemberById({
        client: this.supabase,
        memberId: existing.id,
        input: { access: input.access },
      });
    }

    return this.repository.createAgentMember({
      client: this.supabase,
      input: {
        orgId: agent.orgId,
        agentId,
        subjectType: 'user',
        subjectId: input.userId,
        access: input.access,
        createdBy: actorProfileId,
      },
    });
  }

  /** Revokes agent access for a user. */
  async revokeAgentMember({ agentId, actorAuthUserId, input }: TAgentMemberRevokeParams) {
    void actorAuthUserId;

    await this.getAgent({ agentId });

    const revoked = await this.repository.revokeAgentMemberByAgentAndUserId({
      client: this.supabase,
      agentId,
      userId: input.userId,
    });

    if (!revoked) {
      throw new AgentMemberNotFoundError(agentId, input.userId);
    }

    return revoked;
  }

  /** Lists agent invitations for an agent. */
  async listAgentInvitations({ agentId }: TAgentParams) {
    await this.getAgent({ agentId });

    return this.repository.listAgentInvitationsByAgentId({ client: this.supabase, agentId });
  }

  /** Fetches one agent invitation by id. */
  async getAgentInvitation({ agentId, invitationId }: TAgentInvitationParams) {
    await this.getAgent({ agentId });

    const invitation = await this.repository.getAgentInvitationById({
      client: this.supabase,
      agentId,
      invitationId,
    });

    if (!invitation) {
      throw new AgentInvitationNotFoundError(agentId, invitationId);
    }

    return invitation;
  }

  /** Creates an agent invitation and returns the single-use accept token. */
  async createAgentInvitation({ agentId, actorAuthUserId, input }: TAgentInvitationCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const { agent } = await this.getAgent({ agentId });
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt =
      input.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invitation = await this.repository.createAgentInvitation({
      client: this.supabase,
      input: {
        orgId: agent.orgId,
        agentId,
        email: input.email.trim().toLowerCase(),
        access: input.access,
        tokenHash,
        expiresAt,
        invitedBy: actorProfileId,
      },
    });

    const { tokenHash: storedTokenHash, ...publicInvitation } = invitation;
    void storedTokenHash;

    return {
      invitation: publicInvitation,
      token,
    };
  }
}

/** @deprecated Use AgentUseCaseService */
export const AgentMembershipContextService = AgentUseCaseService;
