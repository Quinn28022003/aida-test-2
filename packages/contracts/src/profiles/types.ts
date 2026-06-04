import type { ProfilesRow } from '@aida/db';
import type { TAgent, TAgentMembership, TConversation, TConversationMembership } from '../agents/types';
import type { TOrganization, TOrganizationMembership } from '../organizations/types';
import type { TAuthUserParams } from '../params.types';
import type { TJob, TJobMembership, TProject, TProjectMembership } from '../projects/types';

export type TProfilesRepositoryClient = unknown;

export type TProfile = ProfilesRow;

export type TMeMemberships = {
  agents: TAgentMembership[];
  conversations: TConversationMembership[];
  organizations: TOrganizationMembership[];
  projects: TProjectMembership[];
  jobs: TJobMembership[];
};

export type TMeContext = {
  organizations: TOrganization[];
  projects: TProject[];
  jobs: TJob[];
  agents: TAgent[];
  conversations: TConversation[];
  memberships: TMeMemberships;
};

export type TResolvedMeContext = TMeContext;

export type TProfileAuthUserParams = TAuthUserParams;
