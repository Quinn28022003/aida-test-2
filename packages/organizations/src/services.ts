import type {
  TOrganizationActorParams,
  TOrganizationCreateParams,
  TOrganizationMemberActorParams,
  TOrganizationMemberUpdateParams,
  TOrganizationUpdateParams,
  TOrganizationUserParams,
} from '@aida/contracts';

import {
  OrganizationActorProfileNotFoundError,
  OrganizationMemberNotFoundError,
  OrganizationNotFoundError,
} from './organizations.errors';
import type { OrganizationsRepository, OrganizationsService, OrganizationsSupabaseClient } from './organizations.types';

/** Returns the unique string values while preserving their first-seen order. */
function dedupe(values: readonly string[]) {
  return [...new Set(values)];
}

export class OrganizationUseCaseService implements OrganizationsService {
  constructor(
    private readonly supabase: OrganizationsSupabaseClient,
    private readonly repository: OrganizationsRepository,
  ) { }

  /** Lists all organization memberships for a profile user id. */
  async listMembershipsForUserId({ userId }: TOrganizationUserParams) {
    return this.repository.listOrganizationMembershipsByUserId({ client: this.supabase, userId });
  }

  /** Lists organizations linked to a profile through organization memberships. */
  async listOrganizationsForUserId({ userId }: TOrganizationUserParams) {
    const memberships = await this.repository.listOrganizationMembershipsByUserId({ client: this.supabase, userId });

    return this.repository.listOrganizationsByIds({
      client: this.supabase,
      orgIds: dedupe(memberships.map((membership) => membership.orgId)),
    });
  }

  /** Creates an organization owned by the authenticated actor profile. */
  async createOrganization({ actorAuthUserId, input }: TOrganizationCreateParams) {
    const actorProfile = await this.repository.getProfileByAuthUserId({
      client: this.supabase,
      authUserId: actorAuthUserId,
    });

    if (!actorProfile) {
      throw new OrganizationActorProfileNotFoundError(actorAuthUserId);
    }

    const organization = await this.repository.bootstrapOrganization({
      client: this.supabase,
      input: {
        ...input,
      },
    });

    return organization;
  }

  /** Updates organization fields by id. */
  async updateOrganization({ orgId, actorAuthUserId, input }: TOrganizationUpdateParams) {
    void actorAuthUserId;

    const organization = await this.repository.updateOrganizationById({
      client: this.supabase,
      orgId,
      input,
    });

    return organization;
  }

  /** Deletes an organization by id. */
  async deleteOrganization({ orgId, actorAuthUserId }: TOrganizationActorParams) {
    void actorAuthUserId;

    const organization = await this.repository.deleteOrganizationById({ client: this.supabase, orgId });

    if (!organization) {
      throw new OrganizationNotFoundError(orgId);
    }

    return organization;
  }

  /** Gets one organization member by id. */
  async getMember({ orgId, memberId, actorAuthUserId }: TOrganizationMemberActorParams) {
    void actorAuthUserId;

    const member = await this.repository.getOrganizationMemberById({ client: this.supabase, orgId, memberId });

    if (!member) {
      throw new OrganizationMemberNotFoundError(orgId, memberId);
    }

    return member;
  }

  /** Updates member status, member type, and role links. */
  async updateMember({ orgId, memberId, actorAuthUserId, input }: TOrganizationMemberUpdateParams) {
    const actorProfile = await this.repository.getProfileByAuthUserId({
      client: this.supabase,
      authUserId: actorAuthUserId,
    });

    if (!actorProfile) {
      throw new OrganizationActorProfileNotFoundError(actorAuthUserId);
    }

    const member = await this.repository.getOrganizationMemberById({ client: this.supabase, orgId, memberId });

    if (!member) {
      throw new OrganizationMemberNotFoundError(orgId, memberId);
    }

    let updatedMember = member;

    if (
      (input.status && input.status !== member.status) ||
      (input.memberType && input.memberType !== member.memberType)
    ) {
      updatedMember = await this.repository.updateOrganizationMember({
        client: this.supabase,
        orgId,
        memberId,
        input: {
          status: input.status,
          member_type: input.memberType,
        },
      });
    }

    if (input.roleKeys) {
      const roles = await this.repository.listRolesByOrgId({ client: this.supabase, orgId });
      const targetRoles = roles.filter((role) => input.roleKeys?.includes(role.key));

      await this.repository.deleteMemberRolesForUser({ client: this.supabase, orgId, userId: member.userId });

      for (const role of targetRoles) {
        await this.repository.createMemberRole({
          client: this.supabase,
          input: {
            org_id: orgId,
            user_id: member.userId,
            role_id: role.id,
            assigned_by: actorProfile.id,
          },
        });
      }
    }

    return updatedMember;
  }

  /** Removes a member and their organization role links. */
  async removeMember({ orgId, memberId, actorAuthUserId }: TOrganizationMemberActorParams) {
    void actorAuthUserId;

    const member = await this.repository.getOrganizationMemberById({ client: this.supabase, orgId, memberId });

    if (!member) {
      throw new OrganizationMemberNotFoundError(orgId, memberId);
    }

    await this.repository.deleteMemberRolesForUser({ client: this.supabase, orgId, userId: member.userId });

    const deletedMember = await this.repository.deleteOrganizationMember({ client: this.supabase, orgId, memberId });

    if (!deletedMember) {
      throw new OrganizationMemberNotFoundError(orgId, memberId);
    }

    return deletedMember;
  }
}
