import {
  type GroupMembersRow,
  groupMembersRowSchema,
  groupsRowSchema,
  jobMembersRowSchema,
  jobsRowSchema,
  memberRolesRowSchema,
  organizationMembersRowSchema,
  parseDatabaseRow,
  profilesRowSchema,
  projectMembersRowSchema,
  projectsRowSchema,
  rolePermissionsRowSchema,
  rolesRowSchema,
  subjectPermissionGrantsRowSchema,
  type GroupsRow,
  type JobMembersRow,
  type JobsRow,
  type MemberRolesRow,
  type OrganizationMembersRow,
  type ProfilesRow,
  type ProjectMembersRow,
  type ProjectsRow,
  type RolePermissionsRow,
  type RolesRow,
  type SubjectPermissionGrantsRow,
} from '@aida/db';
import type { z } from 'zod';

import type { ProjectsRepository } from './projects.types';

type RepositoryParams<TMethod extends keyof ProjectsRepository> = ProjectsRepository[TMethod] extends (
  params: infer TParams,
) => unknown
  ? TParams
  : never;

/** Parses a nullable Supabase row array with the supplied database schema. */
function parseRows<TRow>(rows: Record<string, unknown>[] | null, schema: z.ZodType<TRow>) {
  return (rows ?? []).map((row) => parseDatabaseRow(row, schema)) as TRow[];
}

export class SupabaseProjectsRepository implements ProjectsRepository {
  /** Fetches a profile by its auth provider user id. */
  async getProfileByAuthUserId({
    client: supabase,
    authUserId,
  }: RepositoryParams<'getProfileByAuthUserId'>): Promise<ProfilesRow | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('auth_user_id', authUserId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, profilesRowSchema) : null;
  }

  /** Fetches one organization membership for a profile user id. */
  async getOrganizationMembership({
    client: supabase,
    orgId,
    userId,
  }: RepositoryParams<'getOrganizationMembership'>): Promise<OrganizationMembersRow | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, organizationMembersRowSchema) : null;
  }

  /** Fetches one project by id. */
  async getProjectById({
    client: supabase,
    projectId,
  }: RepositoryParams<'getProjectById'>): Promise<ProjectsRow | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, projectsRowSchema) : null;
  }

  /** Lists projects that belong to an organization. */
  async listProjectsByOrgId({
    client: supabase,
    orgId,
  }: RepositoryParams<'listProjectsByOrgId'>): Promise<ProjectsRow[]> {
    const { data, error } = await supabase.from('projects').select('*').eq('org_id', orgId).order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<ProjectsRow>(data, projectsRowSchema);
  }

  /** Fetches projects by id, returning an empty list when no ids are supplied. */
  async listProjectsByIds({
    client: supabase,
    projectIds,
  }: RepositoryParams<'listProjectsByIds'>): Promise<ProjectsRow[]> {
    if (projectIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('id', [...projectIds])
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<ProjectsRow>(data, projectsRowSchema);
  }

  /** Inserts a project row and returns the created record. */
  async createProject({ client: supabase, input }: RepositoryParams<'createProject'>): Promise<ProjectsRow> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        org_id: input.orgId,
        key: input.key,
        name: input.name,
        description: input.description,
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, projectsRowSchema);
  }

  /** Updates a project by id and returns the updated record. */
  async updateProjectById({
    client: supabase,
    projectId,
    input,
  }: RepositoryParams<'updateProjectById'>): Promise<ProjectsRow> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        key: input.key,
        name: input.name,
        description: input.description,
        status: input.status,
      })
      .eq('id', projectId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, projectsRowSchema);
  }

  /** Lists membership rows for a project. */
  async listProjectMembers({
    client: supabase,
    projectId,
  }: RepositoryParams<'listProjectMembers'>): Promise<ProjectMembersRow[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<ProjectMembersRow>(data, projectMembersRowSchema);
  }

  /** Fetches one project membership for a profile user id. */
  async getProjectMemberByUserId({
    client: supabase,
    projectId,
    userId,
  }: RepositoryParams<'getProjectMemberByUserId'>): Promise<ProjectMembersRow | null> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, projectMembersRowSchema) : null;
  }

  /** Lists project memberships for a profile, optionally scoped to an organization. */
  async listProjectMembershipsByUserId({
    client: supabase,
    userId,
    orgId,
  }: RepositoryParams<'listProjectMembershipsByUserId'>): Promise<ProjectMembersRow[]> {
    let query = supabase.from('project_members').select('*').eq('user_id', userId);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<ProjectMembersRow>(data, projectMembersRowSchema);
  }

  /** Inserts a project membership row and returns the created record. */
  async createProjectMember({
    client: supabase,
    input,
  }: RepositoryParams<'createProjectMember'>): Promise<ProjectMembersRow> {
    const { data, error } = await supabase
      .from('project_members')
      .insert({
        org_id: input.orgId,
        project_id: input.projectId,
        user_id: input.userId,
        project_role: input.projectRole,
        invited_by: input.invitedBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, projectMembersRowSchema);
  }

  /** Deletes a project membership by project and user id. */
  async deleteProjectMemberByProjectAndUserId({
    client: supabase,
    projectId,
    userId,
  }: RepositoryParams<'deleteProjectMemberByProjectAndUserId'>): Promise<ProjectMembersRow | null> {
    const { data, error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, projectMembersRowSchema) : null;
  }

  /** Lists jobs that belong to a project. */
  async listJobsByProjectId({
    client: supabase,
    projectId,
  }: RepositoryParams<'listJobsByProjectId'>): Promise<JobsRow[]> {
    const { data, error } = await supabase.from('jobs').select('*').eq('project_id', projectId).order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<JobsRow>(data, jobsRowSchema);
  }

  /** Fetches jobs by id, returning an empty list when no ids are supplied. */
  async listJobsByIds({ client: supabase, jobIds }: RepositoryParams<'listJobsByIds'>): Promise<JobsRow[]> {
    if (jobIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .in('id', [...jobIds])
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<JobsRow>(data, jobsRowSchema);
  }

  /** Fetches one job by id. */
  async getJobById({ client: supabase, jobId }: RepositoryParams<'getJobById'>): Promise<JobsRow | null> {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, jobsRowSchema) : null;
  }

  /** Inserts a job row and returns the created record. */
  async createJob({ client: supabase, input }: RepositoryParams<'createJob'>): Promise<JobsRow> {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        org_id: input.orgId,
        project_id: input.projectId,
        customer_profile_id: input.customerProfileId,
        title: input.title,
        external_ref: input.externalRef,
        metadata: input.metadata,
        status: input.status,
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, jobsRowSchema);
  }

  /** Updates a job by id and returns the updated record. */
  async updateJobById({ client: supabase, jobId, input }: RepositoryParams<'updateJobById'>): Promise<JobsRow> {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        title: input.title,
        external_ref: input.externalRef,
        metadata: input.metadata,
        status: input.status,
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, jobsRowSchema);
  }

  /** Lists job memberships for a profile, optionally scoped to a project. */
  async listJobMembershipsByUserId({
    client: supabase,
    userId,
    projectId,
  }: RepositoryParams<'listJobMembershipsByUserId'>): Promise<JobMembersRow[]> {
    let query = supabase.from('job_members').select('*').eq('user_id', userId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<JobMembersRow>(data, jobMembersRowSchema);
  }

  /** Lists job members for a job within a project. */
  async listJobMembersByJobId({
    client: supabase,
    projectId,
    jobId,
  }: RepositoryParams<'listJobMembersByJobId'>): Promise<JobMembersRow[]> {
    const { data, error } = await supabase
      .from('job_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('job_id', jobId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<JobMembersRow>(data, jobMembersRowSchema);
  }

  /** Lists direct member-role assignments for a profile in an organization. */
  async listMemberRolesForUser({
    client: supabase,
    orgId,
    userId,
  }: RepositoryParams<'listMemberRolesForUser'>): Promise<MemberRolesRow[]> {
    const { data, error } = await supabase.from('member_roles').select('*').eq('org_id', orgId).eq('user_id', userId);

    if (error) {
      throw error;
    }

    return parseRows<MemberRolesRow>(data, memberRolesRowSchema);
  }

  /** Fetches roles by id, returning an empty list when no ids are supplied. */
  async listRolesByIds({ client: supabase, roleIds }: RepositoryParams<'listRolesByIds'>): Promise<RolesRow[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .in('id', [...roleIds]);

    if (error) {
      throw error;
    }

    return parseRows<RolesRow>(data, rolesRowSchema);
  }

  /** Lists permission links for the supplied role ids. */
  async listRolePermissionsByRoleIds({
    client: supabase,
    roleIds,
  }: RepositoryParams<'listRolePermissionsByRoleIds'>): Promise<RolePermissionsRow[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .in('role_id', [...roleIds]);

    if (error) {
      throw error;
    }

    return parseRows<RolePermissionsRow>(data, rolePermissionsRowSchema);
  }

  /** Lists group ids that include the profile within an organization. */
  async listGroupIdsForUser({
    client: supabase,
    orgId,
    userId,
  }: RepositoryParams<'listGroupIdsForUser'>): Promise<string[]> {
    const { data, error } = await supabase.from('group_members').select('*').eq('org_id', orgId).eq('user_id', userId);

    if (error) {
      throw error;
    }

    return parseRows<GroupMembersRow>(data, groupMembersRowSchema).map((row) => row.groupId);
  }

  /** Fetches groups by id, returning an empty list when no ids are supplied. */
  async listGroupsByIds({ client: supabase, groupIds }: RepositoryParams<'listGroupsByIds'>): Promise<GroupsRow[]> {
    if (groupIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', [...groupIds]);

    if (error) {
      throw error;
    }

    return parseRows<GroupsRow>(data, groupsRowSchema);
  }

  /** Lists role ids assigned to the supplied groups within an organization. */
  async listGroupRoleIds({
    client: supabase,
    orgId,
    groupIds,
  }: RepositoryParams<'listGroupRoleIds'>): Promise<string[]> {
    if (groupIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('group_roles')
      .select('role_id')
      .eq('org_id', orgId)
      .in('group_id', [...groupIds]);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => String(row.role_id));
  }

  /** Lists direct permission grants for a profile and its groups within an organization. */
  async listDirectPermissionGrants({
    client: supabase,
    orgId,
    userId,
    groupIds,
  }: RepositoryParams<'listDirectPermissionGrants'>): Promise<SubjectPermissionGrantsRow[]> {
    const subjects = [userId, ...groupIds];

    const { data, error } = await supabase
      .from('subject_permission_grants')
      .select('*')
      .eq('org_id', orgId)
      .in('subject_id', subjects);

    if (error) {
      throw error;
    }

    return parseRows<SubjectPermissionGrantsRow>(data, subjectPermissionGrantsRowSchema);
  }
}
