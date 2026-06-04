import type {
  TJobActorParams,
  TJobCreateParams,
  TJobUpdateParams,
  TProjectActorParams,
  TProjectCreateParams,
  TProjectJobUserScopeParams,
  TProjectMemberCreateParams,
  TProjectMemberDeleteParams,
  TProjectUpdateParams,
  TProjectUserScopeParams,
} from '@aida/contracts';

import {
  JobNotFoundError,
  ProjectActorProfileNotFoundError,
  ProjectMemberNotFoundError,
  ProjectNotFoundError,
} from './projects.errors';
import type { ProjectsRepository, ProjectsService, ProjectsSupabaseClient } from './projects.types';

export class ProjectUseCaseService implements ProjectsService {
  constructor(
    private readonly supabase: ProjectsSupabaseClient,
    private readonly repository: ProjectsRepository,
  ) {}

  private async getActorProfileId(actorAuthUserId: string) {
    const actorProfile = await this.repository.getProfileByAuthUserId({
      client: this.supabase,
      authUserId: actorAuthUserId,
    });

    if (!actorProfile) {
      throw new ProjectActorProfileNotFoundError(actorAuthUserId);
    }

    return actorProfile.id;
  }

  /** Creates a project and assigns the actor as the project owner. */
  async createProject({ orgId, actorAuthUserId, input }: TProjectCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);

    const project = await this.repository.createProject({
      client: this.supabase,
      input: {
        ...input,
        orgId,
        createdBy: actorProfileId,
      },
    });

    await this.repository.createProjectMember({
      client: this.supabase,
      input: {
        orgId,
        projectId: project.id,
        userId: actorProfileId,
        projectRole: 'owner',
        invitedBy: actorProfileId,
      },
    });

    return project;
  }

  /** Gets a project by id. */
  async getProject({ projectId, actorAuthUserId }: TProjectActorParams) {
    void actorAuthUserId;

    const project = await this.repository.getProjectById({ client: this.supabase, projectId });

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    return project;
  }

  /** Updates a project by id. */
  async updateProject({ projectId, actorAuthUserId, input }: TProjectUpdateParams) {
    void actorAuthUserId;

    const project = await this.repository.updateProjectById({
      client: this.supabase,
      projectId,
      input,
    });

    return project;
  }

  /** Lists project members for a project id. */
  async listMembers({ projectId, actorAuthUserId }: TProjectActorParams) {
    void actorAuthUserId;

    return this.repository.listProjectMembers({ client: this.supabase, projectId });
  }

  /** Adds a project member and records the actor as inviter. */
  async addMember({ projectId, actorAuthUserId, input }: TProjectMemberCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const project = await this.getProject({ projectId, actorAuthUserId });

    const membership = await this.repository.createProjectMember({
      client: this.supabase,
      input: {
        ...input,
        orgId: project.orgId,
        projectId,
        invitedBy: actorProfileId,
      },
    });

    return membership;
  }

  /** Removes a project member by user id. */
  async removeMember({ projectId, actorAuthUserId, input }: TProjectMemberDeleteParams) {
    void actorAuthUserId;

    const membership = await this.repository.deleteProjectMemberByProjectAndUserId({
      client: this.supabase,
      projectId,
      userId: input.userId,
    });

    if (!membership) {
      throw new ProjectMemberNotFoundError(projectId, input.userId);
    }

    return membership;
  }

  /** Lists jobs for a project id. */
  async listJobs({ projectId, actorAuthUserId }: TProjectActorParams) {
    void actorAuthUserId;
    return this.repository.listJobsByProjectId({ client: this.supabase, projectId });
  }

  /** Gets a job when it belongs to the project. */
  async getJob({ projectId, jobId, actorAuthUserId }: TJobActorParams) {
    void actorAuthUserId;
    const job = await this.repository.getJobById({ client: this.supabase, jobId });

    if (!job || job.projectId !== projectId) {
      throw new JobNotFoundError(jobId);
    }

    return job;
  }

  /** Creates a job and records the actor as creator. */
  async createJob({ projectId, actorAuthUserId, input }: TJobCreateParams) {
    const actorProfileId = await this.getActorProfileId(actorAuthUserId);
    const project = await this.getProject({ projectId, actorAuthUserId });

    const job = await this.repository.createJob({
      client: this.supabase,
      input: {
        ...input,
        orgId: project.orgId,
        projectId,
        createdBy: actorProfileId,
      },
    });

    return job;
  }

  /** Lists job members for a job after confirming it belongs to the project. */
  async listJobMembers({ projectId, jobId, actorAuthUserId }: TJobActorParams) {
    await this.getJob({ projectId, jobId, actorAuthUserId });

    return this.repository.listJobMembersByJobId({ client: this.supabase, projectId, jobId });
  }

  /** Updates a job after confirming it belongs to the project. */
  async updateJob({ projectId, jobId, actorAuthUserId, input }: TJobUpdateParams) {
    await this.getJob({ projectId, jobId, actorAuthUserId });

    void actorAuthUserId;

    const job = await this.repository.updateJobById({
      client: this.supabase,
      jobId,
      input,
    });

    return job;
  }

  /** Lists projects linked to a profile through project memberships, optionally scoped to an organization. */
  async listAccessibleProjectsForUserId({ userId, orgId }: TProjectUserScopeParams) {
    const memberships = await this.repository.listProjectMembershipsByUserId({ client: this.supabase, userId, orgId });

    return this.repository.listProjectsByIds({
      client: this.supabase,
      projectIds: [...new Set(memberships.map((membership) => membership.projectId))],
    });
  }

  /** Lists project memberships for a profile, optionally scoped to an organization. */
  async listProjectMembershipsForUserId({ userId, orgId }: TProjectUserScopeParams) {
    return this.repository.listProjectMembershipsByUserId({ client: this.supabase, userId, orgId });
  }

  /** Lists job memberships for a profile, optionally scoped to a project. */
  async listJobMembershipsForUserId({ userId, projectId }: TProjectJobUserScopeParams) {
    return this.repository.listJobMembershipsByUserId({ client: this.supabase, userId, projectId });
  }

  /** Lists jobs for a profile, optionally scoped to one project. */
  async listAccessibleJobsForUserId({ userId, projectId }: TProjectJobUserScopeParams) {
    if (!projectId) {
      const jobMemberships = await this.repository.listJobMembershipsByUserId({ client: this.supabase, userId });

      return this.repository.listJobsByIds({
        client: this.supabase,
        jobIds: [...new Set(jobMemberships.map((membership) => membership.jobId))],
      });
    }

    const project = await this.repository.getProjectById({ client: this.supabase, projectId });

    if (!project) {
      return [];
    }

    void userId;
    void project.orgId;
    return this.repository.listJobsByProjectId({ client: this.supabase, projectId });
  }
}
