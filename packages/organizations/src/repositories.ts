import {
  type GroupMembersRow,
  groupMembersRowSchema,
  groupsRowSchema,
  memberRolesRowSchema,
  organizationMembersRowSchema,
  organizationsRowSchema,
  parseDatabaseRow,
  profilesRowSchema,
  rolePermissionsRowSchema,
  rolesRowSchema,
  subjectPermissionGrantsRowSchema,
  type GroupsRow,
  type MemberRolesRow,
  type OrganizationMembersRow,
  type OrganizationsRow,
  type ProfilesRow,
  type RolePermissionsRow,
  type RolesRow,
  type SubjectPermissionGrantsRow,
} from '@aida/db';
import type { z } from 'zod';

import type { OrganizationsRepository } from './organizations.types';

type RepositoryParams<TMethod extends keyof OrganizationsRepository> = OrganizationsRepository[TMethod] extends (
  params: infer TParams,
) => unknown
  ? TParams
  : never;

/** Parses a nullable Supabase row array with the supplied database schema. */
function parseRows<TRow>(rows: Record<string, unknown>[] | null, schema: z.ZodType<TRow>) {
  return (rows ?? []).map((row) => parseDatabaseRow(row, schema)) as TRow[];
}

export class SupabaseOrganizationsRepository implements OrganizationsRepository {
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

  /** Lists organization membership rows for a profile user id. */
  async listOrganizationMembershipsByUserId({
    client: supabase,
    userId,
  }: RepositoryParams<'listOrganizationMembershipsByUserId'>): Promise<OrganizationMembersRow[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<OrganizationMembersRow>(data, organizationMembersRowSchema);
  }

  /** Fetches one organization membership for a profile user id. */
  async getOrganizationMembershipByUserId({
    client: supabase,
    orgId,
    userId,
  }: RepositoryParams<'getOrganizationMembershipByUserId'>): Promise<OrganizationMembersRow | null> {
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

  /** Fetches one organization member by membership id within an organization. */
  async getOrganizationMemberById({
    client: supabase,
    orgId,
    memberId,
  }: RepositoryParams<'getOrganizationMemberById'>): Promise<OrganizationMembersRow | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, organizationMembersRowSchema) : null;
  }

  /** Fetches organizations by id, returning an empty list when no ids are supplied. */
  async listOrganizationsByIds({
    client: supabase,
    orgIds,
  }: RepositoryParams<'listOrganizationsByIds'>): Promise<OrganizationsRow[]> {
    if (orgIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .in('id', [...orgIds])
      .order('created_at');

    if (error) {
      throw error;
    }

    return parseRows<OrganizationsRow>(data, organizationsRowSchema);
  }

  /** Fetches one organization by id. */
  async getOrganizationById({
    client: supabase,
    orgId,
  }: RepositoryParams<'getOrganizationById'>): Promise<OrganizationsRow | null> {
    const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, organizationsRowSchema) : null;
  }

  /** Inserts an organization row and returns the created record. */
  async createOrganization({
    client: supabase,
    input,
  }: RepositoryParams<'createOrganization'>): Promise<OrganizationsRow> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        slug: input.slug,
        data_region: input.dataRegion,
        default_locale: input.defaultLocale,
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, organizationsRowSchema);
  }

  /** Bootstraps an organization and creator ownership using a single user-scoped RPC. */
  async bootstrapOrganization({
    client: supabase,
    input,
  }: RepositoryParams<'bootstrapOrganization'>): Promise<OrganizationsRow> {
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
    };
    const { data, error } = await rpcClient.rpc('bootstrap_organization', {
      p_name: input.name,
      p_slug: input.slug,
      p_data_region: input.dataRegion,
      p_default_locale: input.defaultLocale,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('bootstrap_organization returned no row');
    }

    return parseDatabaseRow(data, organizationsRowSchema);
  }

  /** Updates an organization by id and returns the updated record. */
  async updateOrganizationById({
    client: supabase,
    orgId,
    input,
  }: RepositoryParams<'updateOrganizationById'>): Promise<OrganizationsRow> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: input.name,
        slug: input.slug,
        data_region: input.dataRegion,
        default_locale: input.defaultLocale,
      })
      .eq('id', orgId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, organizationsRowSchema);
  }

  /** Deletes an organization by id and returns the deleted record when found. */
  async deleteOrganizationById({
    client: supabase,
    orgId,
  }: RepositoryParams<'deleteOrganizationById'>): Promise<OrganizationsRow | null> {
    const { data, error } = await supabase.from('organizations').delete().eq('id', orgId).select('*').maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, organizationsRowSchema) : null;
  }

  /** Inserts an organization membership row and returns the created record. */
  async createOrganizationMember({
    client: supabase,
    input,
  }: RepositoryParams<'createOrganizationMember'>): Promise<OrganizationMembersRow> {
    const { data, error } = await supabase.from('organization_members').insert(input).select('*').single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, organizationMembersRowSchema);
  }

  /** Updates an organization membership and returns the updated record. */
  async updateOrganizationMember({
    client: supabase,
    orgId,
    memberId,
    input,
  }: RepositoryParams<'updateOrganizationMember'>): Promise<OrganizationMembersRow> {
    const { data, error } = await supabase
      .from('organization_members')
      .update(input)
      .eq('org_id', orgId)
      .eq('id', memberId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, organizationMembersRowSchema);
  }

  /** Deletes an organization membership and returns the deleted record when found. */
  async deleteOrganizationMember({
    client: supabase,
    orgId,
    memberId,
  }: RepositoryParams<'deleteOrganizationMember'>): Promise<OrganizationMembersRow | null> {
    const { data, error } = await supabase
      .from('organization_members')
      .delete()
      .eq('org_id', orgId)
      .eq('id', memberId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, organizationMembersRowSchema) : null;
  }

  /** Fetches a global system role by key. */
  async getSystemRoleByKey({
    client: supabase,
    roleKey,
  }: RepositoryParams<'getSystemRoleByKey'>): Promise<RolesRow | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .is('org_id', null)
      .eq('key', roleKey)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? parseDatabaseRow(data, rolesRowSchema) : null;
  }

  /** Lists role rows that belong to an organization. */
  async listRolesByOrgId({ client: supabase, orgId }: RepositoryParams<'listRolesByOrgId'>): Promise<RolesRow[]> {
    const { data, error } = await supabase.from('roles').select('*').eq('org_id', orgId);

    if (error) {
      throw error;
    }

    return parseRows<RolesRow>(data, rolesRowSchema);
  }

  /** Inserts role rows, skipping the query when there is nothing to insert. */
  async insertRoles({ client: supabase, rows }: RepositoryParams<'insertRoles'>): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await supabase.from('roles').insert(rows);

    if (error) {
      throw error;
    }
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

  /** Upserts role permission links while ignoring duplicate role-permission pairs. */
  async upsertRolePermissions({ client: supabase, rows }: RepositoryParams<'upsertRolePermissions'>): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('role_permissions')
      .upsert(rows, { onConflict: 'role_id,permission_key', ignoreDuplicates: true });

    if (error) {
      throw error;
    }
  }

  /** Inserts a direct member-role assignment and returns the created record. */
  async createMemberRole({ client: supabase, input }: RepositoryParams<'createMemberRole'>): Promise<MemberRolesRow> {
    const { data, error } = await supabase.from('member_roles').insert(input).select('*').single();

    if (error) {
      throw error;
    }

    return parseDatabaseRow(data, memberRolesRowSchema);
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

  /** Deletes all direct member-role assignments for a profile in an organization. */
  async deleteMemberRolesForUser({
    client: supabase,
    orgId,
    userId,
  }: RepositoryParams<'deleteMemberRolesForUser'>): Promise<void> {
    const { error } = await supabase.from('member_roles').delete().eq('org_id', orgId).eq('user_id', userId);

    if (error) {
      throw error;
    }
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
