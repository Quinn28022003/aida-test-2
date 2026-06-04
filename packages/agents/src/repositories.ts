import {
  agentInvitationsRowSchema,
  agentMembersRowSchema,
  agentVersionsRowSchema,
  agentsRowSchema,
  conversationMembersRowSchema,
  conversationsRowSchema,
  parseDatabaseRow,
  profilesRowSchema,
  projectAgentsRowSchema,
  projectsRowSchema,
  type AgentInvitationsRow,
  type AgentMembersRow,
  type AgentVersionInsert,
  type AgentVersionInsertWithoutVersion,
  type AgentVersionsRow,
  type AgentsRow,
  type ConversationMembersRow,
  type ConversationsRow,
  type ProfilesRow,
  type ProjectAgentsRow,
  type ProjectsRow,
} from '@aida/db';
import type {
  TAgentDetail,
  TAgentIdsParams,
  TAgentInvitationParams,
  TAgentParams,
  TAgentVersion,
  TAgentsRepositoryCreateAgentInput,
  TAgentsRepositoryCreateAgentInvitationInput,
  TAgentsRepositoryCreateAgentMemberInput,
  TAgentsRepositoryCreateAgentVersionInput,
  TAgentsRepositoryCreateProjectAgentInput,
  TAgentsRepositoryReactivateAgentMemberInput,
  TAgentsRepositoryUpdateAgentInput,
  TAgentsRepositoryUpdateAgentVersionInput,
  TAuthUserParams,
  TConversationIdsParams,
  TInputParams,
  TProjectAgentListItem,
  TProjectAgentsParams,
  TProjectParams,
  TRepositoryClientParams,
  TUserParams,
} from '@aida/contracts';

import type { AgentsRepository, AgentsSupabaseClient } from './agents.types';

export class SupabaseAgentsRepository implements AgentsRepository {
  /** Fetches a profile by its auth provider user id. */
  async getProfileByAuthUserId({
    client: supabase,
    authUserId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAuthUserParams): Promise<ProfilesRow | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('auth_user_id', authUserId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, profilesRowSchema) : null;
  }

  /** Fetches one project by id. */
  async getProjectById({
    client: supabase,
    projectId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TProjectParams): Promise<ProjectsRow | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, projectsRowSchema) : null;
  }

  /** Lists agents visible to the current session. */
  async listAgents({ client: supabase }: TRepositoryClientParams<AgentsSupabaseClient>): Promise<AgentsRow[]> {
    const { data, error } = await supabase.from('agents').select('*').order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => parseDatabaseRow(row, agentsRowSchema));
  }

  /** Fetches agent membership rows for a profile user id. */
  async listAgentMembershipsByUserId({
    client: supabase,
    userId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TUserParams): Promise<AgentMembersRow[]> {
    const { data, error } = await supabase
      .from('agent_members')
      .select('*')
      .eq('subject_type', 'user')
      .eq('subject_id', userId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((membership: Record<string, unknown>) =>
      parseDatabaseRow(membership, agentMembersRowSchema),
    );
  }

  /** Fetches agents by id, returning an empty list when no ids are supplied. */
  async listAgentsByIds({
    client: supabase,
    agentIds,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentIdsParams): Promise<AgentsRow[]> {
    if (agentIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .in('id', [...agentIds])
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => parseDatabaseRow(row, agentsRowSchema));
  }

  /** Fetches conversation membership rows for a profile user id. */
  async listConversationMembershipsByUserId({
    client: supabase,
    userId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TUserParams): Promise<ConversationMembersRow[]> {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('subject_type', 'user')
      .eq('subject_id', userId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((membership: Record<string, unknown>) =>
      parseDatabaseRow(membership, conversationMembersRowSchema),
    );
  }

  /** Fetches conversations by id, returning an empty list when no ids are supplied. */
  async listConversationsByIds({
    client: supabase,
    conversationIds,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TConversationIdsParams): Promise<ConversationsRow[]> {
    if (conversationIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', [...conversationIds])
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => parseDatabaseRow(row, conversationsRowSchema));
  }

  /** Lists project-linked agents with active version config when present. */
  async listProjectAgents({
    client: supabase,
    projectId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TProjectAgentsParams): Promise<TProjectAgentListItem[]> {
    const { data, error } = await supabase
      .from('project_agents')
      .select(
        `
        *,
        agents (
          *,
          active_version:agent_versions!agents_active_version_fk (*)
        )
      `,
      )
      .eq('project_id', projectId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const projectAgent = parseDatabaseRow(row, projectAgentsRowSchema);
      const agentRecord = row.agents as Record<string, unknown> | null | undefined;
      const agent = parseDatabaseRow(agentRecord ?? {}, agentsRowSchema);
      const activeVersionRecord = agentRecord?.active_version as Record<string, unknown> | null | undefined;

      return {
        projectAgent,
        agent,
        activeVersion: activeVersionRecord
          ? parseDatabaseRow(activeVersionRecord, agentVersionsRowSchema)
          : null,
      } satisfies TProjectAgentListItem;
    });
  }

  /** Fetches one agent with active version and project links. */
  async getAgentById({
    client: supabase,
    agentId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams): Promise<TAgentDetail | null> {
    const { data, error } = await supabase
      .from('agents')
      .select(
        `
        *,
        active_version:agent_versions!agents_active_version_fk (*),
        project_agents (*)
      `,
      )
      .eq('id', agentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as Record<string, unknown>;
    const activeVersionRecord = row.active_version as Record<string, unknown> | null | undefined;

    return {
      agent: parseDatabaseRow(row, agentsRowSchema),
      activeVersion: activeVersionRecord
        ? parseDatabaseRow(activeVersionRecord, agentVersionsRowSchema)
        : null,
      projectLinks: ((row.project_agents as Record<string, unknown>[] | null) ?? []).map((link) =>
        parseDatabaseRow(link, projectAgentsRowSchema),
      ),
    } satisfies TAgentDetail;
  }

  /** Inserts an agent row and returns the created record. */
  async createAgent({
    client: supabase,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TInputParams<TAgentsRepositoryCreateAgentInput>): Promise<AgentsRow> {
    const { data, error } = await supabase
      .from('agents')
      .insert({
        org_id: input.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        status: input.status ?? 'draft',
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentsRowSchema);
  }

  /** Links an agent to a project. */
  async createProjectAgent({
    client: supabase,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TInputParams<TAgentsRepositoryCreateProjectAgentInput>): Promise<ProjectAgentsRow> {
    const { data, error } = await supabase
      .from('project_agents')
      .insert({
        org_id: input.orgId,
        project_id: input.projectId,
        agent_id: input.agentId,
        visibility: input.visibility ?? 'restricted',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, projectAgentsRowSchema);
  }

  /** Inserts an agent version row and returns the created record. */
  async createAgentVersion({
    client: supabase,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TInputParams<TAgentsRepositoryCreateAgentVersionInput>): Promise<AgentVersionsRow> {
    const insertRow: AgentVersionInsertWithoutVersion = {
      org_id: input.orgId,
      agent_id: input.agentId,
      status: input.status ?? 'active',
      instructions: input.instructions,
      model_provider: input.modelProvider ?? 'bedrock',
      model_name: input.modelName,
      model_profile: input.modelProfile ?? 'balanced',
      temperature: input.temperature ?? 0.2,
      max_output_tokens: input.maxOutputTokens ?? 2048,
      response_policy: input.responsePolicy ?? {},
      memory_policy: input.memoryPolicy ?? {},
      rag_policy: input.ragPolicy ?? {},
      tool_policy: input.toolPolicy ?? {},
      created_by: input.createdBy,
    };

    const { data, error } = await supabase
      .from('agent_versions')
      .insert(insertRow as AgentVersionInsert)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentVersionsRowSchema);
  }

  /** Updates an agent by id and returns the updated record. */
  async updateAgentById({
    client: supabase,
    agentId,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams & TInputParams<TAgentsRepositoryUpdateAgentInput>): Promise<AgentsRow> {
    const { data, error } = await supabase
      .from('agents')
      .update({
        key: input.key,
        name: input.name,
        description: input.description,
        status: input.status,
        active_version_id: input.activeVersionId,
      })
      .eq('id', agentId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentsRowSchema);
  }

  /** Deletes an agent by id and returns the deleted record when present. */
  async deleteAgentById({
    client: supabase,
    agentId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams): Promise<AgentsRow | null> {
    const { data, error } = await supabase.from('agents').delete().eq('id', agentId).select('*').maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, agentsRowSchema) : null;
  }

  /** Fetches one agent version scoped to an agent id. */
  async getAgentVersionById({
    client: supabase,
    agentId,
    versionId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams & { versionId: string }): Promise<TAgentVersion | null> {
    const { data, error } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('id', versionId)
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, agentVersionsRowSchema) : null;
  }

  /** Lists agent versions for an agent, newest version number first. */
  async listAgentVersionsByAgentId({
    client: supabase,
    agentId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams): Promise<AgentVersionsRow[]> {
    const { data, error } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('agent_id', agentId)
      .order('version', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => parseDatabaseRow(row, agentVersionsRowSchema));
  }

  /** Updates an agent version row scoped to an agent id. */
  async updateAgentVersionById({
    client: supabase,
    agentId,
    versionId,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams & { versionId: string } & TInputParams<TAgentsRepositoryUpdateAgentVersionInput>): Promise<AgentVersionsRow> {
    const { data, error } = await supabase
      .from('agent_versions')
      .update({ status: input.status })
      .eq('id', versionId)
      .eq('agent_id', agentId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentVersionsRowSchema);
  }

  /** Lists active agent members for an agent. */
  async listAgentMembersByAgentId({
    client: supabase,
    agentId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams): Promise<AgentMembersRow[]> {
    const { data, error } = await supabase
      .from('agent_members')
      .select('*')
      .eq('agent_id', agentId)
      .is('revoked_at', null)
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => parseDatabaseRow(row, agentMembersRowSchema));
  }

  /** Fetches one agent member by agent and user id, including revoked rows. */
  async getAgentMemberByAgentAndUserId({
    client: supabase,
    agentId,
    userId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams & TUserParams): Promise<AgentMembersRow | null> {
    const { data, error } = await supabase
      .from('agent_members')
      .select('*')
      .eq('agent_id', agentId)
      .eq('subject_type', 'user')
      .eq('subject_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, agentMembersRowSchema) : null;
  }

  /** Inserts an agent member row and returns the created record. */
  async createAgentMember({
    client: supabase,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TInputParams<TAgentsRepositoryCreateAgentMemberInput>): Promise<AgentMembersRow> {
    const { data, error } = await supabase
      .from('agent_members')
      .insert({
        org_id: input.orgId,
        agent_id: input.agentId,
        subject_type: input.subjectType,
        subject_id: input.subjectId,
        access: input.access ?? 'invoker',
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentMembersRowSchema);
  }

  /** Revokes an active agent member by setting revoked_at. */
  async revokeAgentMemberByAgentAndUserId({
    client: supabase,
    agentId,
    userId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams & TUserParams): Promise<AgentMembersRow | null> {
    const { data, error } = await supabase
      .from('agent_members')
      .update({ revoked_at: new Date().toISOString() })
      .eq('agent_id', agentId)
      .eq('subject_type', 'user')
      .eq('subject_id', userId)
      .is('revoked_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, agentMembersRowSchema) : null;
  }

  /** Reactivates a revoked agent member and updates access. */
  async reactivateAgentMemberById({
    client: supabase,
    memberId,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & { memberId: string } & TInputParams<TAgentsRepositoryReactivateAgentMemberInput>): Promise<AgentMembersRow> {
    const { data, error } = await supabase
      .from('agent_members')
      .update({
        revoked_at: null,
        access: input.access ?? 'invoker',
      })
      .eq('id', memberId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentMembersRowSchema);
  }

  /** Lists agent invitations for an agent without token hashes. */
  async listAgentInvitationsByAgentId({
    client: supabase,
    agentId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentParams) {
    const { data, error } = await supabase
      .from('agent_invitations')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const invitation = parseDatabaseRow(row, agentInvitationsRowSchema);
      const { tokenHash, ...publicInvitation } = invitation;
      void tokenHash;

      return publicInvitation;
    });
  }

  /** Fetches one agent invitation without the token hash. */
  async getAgentInvitationById({
    client: supabase,
    agentId,
    invitationId,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TAgentInvitationParams) {
    const { data, error } = await supabase
      .from('agent_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const invitation = parseDatabaseRow(data, agentInvitationsRowSchema);
    const { tokenHash, ...publicInvitation } = invitation;
    void tokenHash;

    return publicInvitation;
  }

  /** Inserts an agent invitation row and returns the created record. */
  async createAgentInvitation({
    client: supabase,
    input,
  }: TRepositoryClientParams<AgentsSupabaseClient> & TInputParams<TAgentsRepositoryCreateAgentInvitationInput>): Promise<AgentInvitationsRow> {
    const { data, error } = await supabase
      .from('agent_invitations')
      .insert({
        org_id: input.orgId,
        agent_id: input.agentId,
        email: input.email,
        access: input.access ?? 'invoker',
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
        invited_by: input.invitedBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, agentInvitationsRowSchema);
  }
}
