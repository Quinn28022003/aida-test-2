import type {
  AgentInvitationsInsert,
  AgentInvitationsRow,
  AgentMembersInsert,
  AgentMembersRow,
  AgentVersionsInsert,
  AgentVersionsRow,
  AgentVersionsUpdate,
  AgentsInsert,
  AgentsRow,
  AgentsUpdate,
  ConversationMembersRow,
  ConversationsRow,
  DatabaseGenerated,
  ProjectAgentsInsert,
  ProjectAgentsRow,
} from '@aida/db';
import type {
  TActorAuthUserParams,
  TInputParams,
  TUserParams,
} from '../params.types';

type TDatabaseEnums = DatabaseGenerated['public']['Enums'];

export type TMembershipSubjectType = TDatabaseEnums['subject_type'];

export type TAgentMemberAccess = TDatabaseEnums['agent_member_access'];

export type TConversationAccessLevel = TDatabaseEnums['access_level'];

export type TAgentsRepositoryClient = unknown;

export type TAgentStatus = TDatabaseEnums['agent_status'];

export type TAgentVersionStatus = TDatabaseEnums['agent_version_status'];

export type TConversationStatus = TDatabaseEnums['conversation_status'];

export type TConversationPriority = TDatabaseEnums['conversation_priority'];

export type TAgent = AgentsRow;

export type TAgentVersion = AgentVersionsRow;

export type TProjectAgent = ProjectAgentsRow;

export type TAgentMembership = AgentMembersRow;

export type TAgentInvitation = AgentInvitationsRow;

export type TAgentInvitationPublic = Omit<TAgentInvitation, 'tokenHash'>;

export type TConversation = ConversationsRow;

export type TConversationMembership = ConversationMembersRow;

export type TAgentUserParams = TUserParams;

export type TAgentIdsParams = {
  agentIds: readonly string[];
};

export type TConversationIdsParams = {
  conversationIds: readonly string[];
};

export type TProjectAgentsParams = {
  projectId: string;
};

export type TAgentParams = {
  agentId: string;
};

export type TAgentInvitationParams = TAgentParams & {
  invitationId: string;
};

export type TAgentActorParams = TAgentParams & TActorAuthUserParams;

export type TProjectAgentListItem = {
  projectAgent: TProjectAgent;
  agent: TAgent;
  activeVersion: TAgentVersion | null;
};

export type TAgentDetail = {
  agent: TAgent;
  activeVersion: TAgentVersion | null;
  projectLinks: TProjectAgent[];
};

export type TAgentVersionCreateInput = Pick<
  AgentVersionsInsert,
  | 'instructions'
  | 'maxOutputTokens'
  | 'memoryPolicy'
  | 'modelName'
  | 'modelProfile'
  | 'modelProvider'
  | 'ragPolicy'
  | 'responsePolicy'
  | 'temperature'
  | 'toolPolicy'
>;

export type TAgentCreateInput = Pick<AgentsInsert, 'description' | 'key' | 'name'> & {
  projectId: string;
  visibility?: string;
  version: TAgentVersionCreateInput;
};

export type TAgentUpdateInput = Partial<Pick<AgentsUpdate, 'description' | 'key' | 'name' | 'status'>> & {
  version: TAgentVersionCreateInput;
};

export type TAgentCreateParams = TActorAuthUserParams & TInputParams<TAgentCreateInput>;

export type TAgentUpdateParams = TAgentParams & TActorAuthUserParams & TInputParams<TAgentUpdateInput>;

export type TAgentDeleteParams = TAgentParams & TActorAuthUserParams;

export type TAgentMemberCreateInput = Pick<AgentMembersInsert, 'access'> & {
  userId: string;
};

export type TAgentMemberRevokeInput = {
  userId: string;
};

export type TAgentMemberCreateParams = TAgentActorParams & TInputParams<TAgentMemberCreateInput>;

export type TAgentMemberRevokeParams = TAgentActorParams & TInputParams<TAgentMemberRevokeInput>;

export type TAgentInvitationCreateInput = Pick<AgentInvitationsInsert, 'access' | 'email'> & {
  expiresAt?: string;
};

export type TAgentInvitationCreateParams = TAgentActorParams & TInputParams<TAgentInvitationCreateInput>;

export type TAgentInvitationCreateResult = {
  invitation: TAgentInvitationPublic;
  token: string;
};

export type TAgentsRepositoryCreateAgentInput = Pick<AgentsInsert, 'createdBy' | 'description' | 'key' | 'name' | 'orgId' | 'status'>;

export type TAgentsRepositoryCreateProjectAgentInput = Pick<
  ProjectAgentsInsert,
  'agentId' | 'orgId' | 'projectId' | 'visibility'
>;

/** Repository create input for agent_versions; version is assigned by DB trigger, not callers. */
export type TAgentsRepositoryCreateAgentVersionInput = Pick<
  AgentVersionsInsert,
  | 'agentId'
  | 'createdBy'
  | 'instructions'
  | 'maxOutputTokens'
  | 'memoryPolicy'
  | 'modelName'
  | 'modelProfile'
  | 'modelProvider'
  | 'orgId'
  | 'ragPolicy'
  | 'responsePolicy'
  | 'status'
  | 'temperature'
  | 'toolPolicy'
>;

export type TAgentsRepositoryUpdateAgentInput = Pick<
  AgentsUpdate,
  'activeVersionId' | 'description' | 'key' | 'name' | 'status'
>;

export type TAgentsRepositoryUpdateAgentVersionInput = Pick<AgentVersionsUpdate, 'status'>;

export type TAgentsRepositoryCreateAgentMemberInput = Pick<
  AgentMembersInsert,
  'access' | 'agentId' | 'createdBy' | 'orgId' | 'subjectId' | 'subjectType'
>;

export type TAgentsRepositoryReactivateAgentMemberInput = Pick<AgentMembersInsert, 'access'>;

export type TAgentsRepositoryCreateAgentInvitationInput = Pick<
  AgentInvitationsInsert,
  'access' | 'agentId' | 'email' | 'expiresAt' | 'invitedBy' | 'orgId' | 'tokenHash'
>;
