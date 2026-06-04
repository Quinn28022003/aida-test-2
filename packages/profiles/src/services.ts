import type { TProfileAuthUserParams } from '@aida/contracts';
import { parseDatabaseRow, profilesRowSchema, type ProfilesRow } from '@aida/db';

import { ProfileNotFoundError } from './profiles.errors';
import type {
  ProfileServiceDependencies,
  ProfilesService,
  ProfilesSupabaseClient,
  ProfilesRepository,
  ResolvedMeContext,
} from './profiles.types';

export class ProfileUseCaseService implements ProfilesService {
  constructor(
    private readonly supabase: ProfilesSupabaseClient,
    private readonly repository: ProfilesRepository,
    private readonly dependencies: ProfileServiceDependencies,
  ) {}

  /** Gets the profile for an auth provider user id or throws when it is missing. */
  async getByAuthUserId({ authUserId }: TProfileAuthUserParams): Promise<ProfilesRow> {
    const profile = await this.repository.getByAuthUserId({ client: this.supabase, authUserId });

    if (!profile) {
      throw new ProfileNotFoundError(authUserId);
    }

    return parseDatabaseRow(profile, profilesRowSchema);
  }

  /** Resolves the current profile's accessible organizations, projects, jobs, agents, and memberships. */
  async getMeContext({ authUserId }: TProfileAuthUserParams): Promise<ResolvedMeContext> {
    const profile = await this.getByAuthUserId({ authUserId });

    const [
      agentMemberships,
      agents,
      conversationMemberships,
      conversations,
      organizationMemberships,
      organizations,
      projects,
      projectMemberships,
      jobs,
      jobMemberships,
    ] = await Promise.all([
      this.dependencies.agentService.listAgentMembershipsForUserId({ userId: profile.id }),
      this.dependencies.agentService.listAccessibleAgentsForUserId({ userId: profile.id }),
      this.dependencies.agentService.listConversationMembershipsForUserId({ userId: profile.id }),
      this.dependencies.agentService.listAccessibleConversationsForUserId({ userId: profile.id }),
      this.dependencies.organizationService.listMembershipsForUserId({ userId: profile.id }),
      this.dependencies.organizationService.listOrganizationsForUserId({ userId: profile.id }),
      this.dependencies.projectService.listAccessibleProjectsForUserId({ userId: profile.id }),
      this.dependencies.projectService.listProjectMembershipsForUserId({ userId: profile.id }),
      this.dependencies.projectService.listAccessibleJobsForUserId({ userId: profile.id }),
      this.dependencies.projectService.listJobMembershipsForUserId({ userId: profile.id }),
    ]);

    return {
      organizations,
      projects,
      jobs,
      agents,
      conversations,
      memberships: {
        agents: agentMemberships,
        conversations: conversationMemberships,
        organizations: organizationMemberships,
        projects: projectMemberships,
        jobs: jobMemberships,
      },
    };
  }
}
