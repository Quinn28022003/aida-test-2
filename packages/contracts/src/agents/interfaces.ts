import type { ProfilesRow, ProjectsRow } from '@aida/db';
import type { TAuthUserParams, TInputParams, TProjectParams, TRepositoryClientParams, TUserParams } from '../params.types';
import type {
  TAgent,
  TAgentCreateParams,
  TAgentDeleteParams,
  TAgentDetail,
  TAgentIdsParams,
  TAgentInvitation,
  TAgentInvitationCreateParams,
  TAgentInvitationCreateResult,
  TAgentInvitationParams,
  TAgentInvitationPublic,
  TAgentMemberCreateParams,
  TAgentMemberRevokeParams,
  TAgentMembership,
  TAgentParams,
  TAgentUpdateParams,
  TAgentUserParams,
  TAgentVersion,
  TAgentsRepositoryClient,
  TAgentsRepositoryCreateAgentInput,
  TAgentsRepositoryCreateAgentInvitationInput,
  TAgentsRepositoryCreateAgentMemberInput,
  TAgentsRepositoryCreateAgentVersionInput,
  TAgentsRepositoryCreateProjectAgentInput,
  TAgentsRepositoryReactivateAgentMemberInput,
  TAgentsRepositoryUpdateAgentInput,
  TAgentsRepositoryUpdateAgentVersionInput,
  TConversation,
  TConversationIdsParams,
  TConversationMembership,
  TProjectAgent,
  TProjectAgentListItem,
  TProjectAgentsParams,
} from './types';

export interface IAgentsRepository<TClient = TAgentsRepositoryClient> {
  getProfileByAuthUserId(params: TRepositoryClientParams<TClient> & TAuthUserParams): Promise<ProfilesRow | null>;
  getProjectById(params: TRepositoryClientParams<TClient> & TProjectParams): Promise<ProjectsRow | null>;
  listAgents(params: TRepositoryClientParams<TClient>): Promise<TAgent[]>;
  listAgentMembershipsByUserId(params: TRepositoryClientParams<TClient> & TUserParams): Promise<TAgentMembership[]>;
  listAgentsByIds(params: TRepositoryClientParams<TClient> & TAgentIdsParams): Promise<TAgent[]>;
  listConversationMembershipsByUserId(params: TRepositoryClientParams<TClient> & TUserParams): Promise<TConversationMembership[]>;
  listConversationsByIds(params: TRepositoryClientParams<TClient> & TConversationIdsParams): Promise<TConversation[]>;
  listProjectAgents(params: TRepositoryClientParams<TClient> & TProjectAgentsParams): Promise<TProjectAgentListItem[]>;
  getAgentById(params: TRepositoryClientParams<TClient> & TAgentParams): Promise<TAgentDetail | null>;
  createAgent(params: TRepositoryClientParams<TClient> & TInputParams<TAgentsRepositoryCreateAgentInput>): Promise<TAgent>;
  createProjectAgent(params: TRepositoryClientParams<TClient> & TInputParams<TAgentsRepositoryCreateProjectAgentInput>): Promise<TProjectAgent>;
  createAgentVersion(params: TRepositoryClientParams<TClient> & TInputParams<TAgentsRepositoryCreateAgentVersionInput>): Promise<TAgentVersion>;
  updateAgentById(params: TRepositoryClientParams<TClient> & TAgentParams & TInputParams<TAgentsRepositoryUpdateAgentInput>): Promise<TAgent>;
  deleteAgentById(params: TRepositoryClientParams<TClient> & TAgentParams): Promise<TAgent | null>;
  getAgentVersionById(params: TRepositoryClientParams<TClient> & TAgentParams & { versionId: string }): Promise<TAgentVersion | null>;
  listAgentVersionsByAgentId(params: TRepositoryClientParams<TClient> & TAgentParams): Promise<TAgentVersion[]>;
  updateAgentVersionById(params: TRepositoryClientParams<TClient> & TAgentParams & { versionId: string } & TInputParams<TAgentsRepositoryUpdateAgentVersionInput>): Promise<TAgentVersion>;
  listAgentMembersByAgentId(params: TRepositoryClientParams<TClient> & TAgentParams): Promise<TAgentMembership[]>;
  getAgentMemberByAgentAndUserId(params: TRepositoryClientParams<TClient> & TAgentParams & TUserParams): Promise<TAgentMembership | null>;
  createAgentMember(params: TRepositoryClientParams<TClient> & TInputParams<TAgentsRepositoryCreateAgentMemberInput>): Promise<TAgentMembership>;
  revokeAgentMemberByAgentAndUserId(params: TRepositoryClientParams<TClient> & TAgentParams & TUserParams): Promise<TAgentMembership | null>;
  reactivateAgentMemberById(params: TRepositoryClientParams<TClient> & { memberId: string } & TInputParams<TAgentsRepositoryReactivateAgentMemberInput>): Promise<TAgentMembership>;
  listAgentInvitationsByAgentId(params: TRepositoryClientParams<TClient> & TAgentParams): Promise<TAgentInvitationPublic[]>;
  getAgentInvitationById(params: TRepositoryClientParams<TClient> & TAgentInvitationParams): Promise<TAgentInvitationPublic | null>;
  createAgentInvitation(params: TRepositoryClientParams<TClient> & TInputParams<TAgentsRepositoryCreateAgentInvitationInput>): Promise<TAgentInvitation>;
}

export interface IAgentsService {
  listAgents(): Promise<TAgent[]>;
  listAgentMembershipsForUserId(params: TAgentUserParams): Promise<TAgentMembership[]>;
  listAccessibleAgentsForUserId(params: TAgentUserParams): Promise<TAgent[]>;
  listConversationMembershipsForUserId(params: TAgentUserParams): Promise<TConversationMembership[]>;
  listAccessibleConversationsForUserId(params: TAgentUserParams): Promise<TConversation[]>;
  listProjectAgents(params: TProjectAgentsParams): Promise<TProjectAgentListItem[]>;
  getAgent(params: TAgentParams): Promise<TAgentDetail>;
  createAgent(params: TAgentCreateParams): Promise<TAgentDetail>;
  updateAgent(params: TAgentUpdateParams): Promise<TAgentDetail>;
  deleteAgent(params: TAgentDeleteParams): Promise<TAgentDetail>;
  listAgentVersions(params: TAgentParams): Promise<TAgentVersion[]>;
  listAgentMembers(params: TAgentParams): Promise<TAgentMembership[]>;
  addAgentMember(params: TAgentMemberCreateParams): Promise<TAgentMembership>;
  revokeAgentMember(params: TAgentMemberRevokeParams): Promise<TAgentMembership>;
  listAgentInvitations(params: TAgentParams): Promise<TAgentInvitationPublic[]>;
  getAgentInvitation(params: TAgentInvitationParams): Promise<TAgentInvitationPublic>;
  createAgentInvitation(params: TAgentInvitationCreateParams): Promise<TAgentInvitationCreateResult>;
}
