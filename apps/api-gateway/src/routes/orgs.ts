import { API_PATHS } from '@aida/contracts';
import { ApiError, mapDomainError, successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import { createOrganizationUseCases } from '../composition/organizations';
import { createProfileUseCases } from '../composition/profiles';
import { createProjectUseCases } from '../composition/projects';
import type { AppVariables } from '../context.types';
import {
  createOrgProjectSchema,
  createOrgSchema,
  orgMemberParamsSchema,
  orgParamsSchema,
  orgProjectsParamsSchema,
  updateMemberSchema,
  updateOrgSchema,
} from '../schemas/orgRoutes';
import { getUserSupabaseClient } from '../supabase/context';
import { getRequiredUserClaimsId } from '../utils/route';

export function createOrgsRoutes() {
  const paths = API_PATHS.orgs.children;

  const orgsRoutes = new Hono<{ Variables: AppVariables }>();

  return orgsRoutes
    .get(paths.list.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const supabase = getUserSupabaseClient(c);
      const profile = await createProfileUseCases(supabase).getByAuthUserId({ authUserId: claimsId });
      const organizations = await createOrganizationUseCases(supabase).listOrganizationsForUserId({ userId: profile.id });

      return successJson(c, organizations);
    })
    .get(paths.byId.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const supabase = getUserSupabaseClient(c);
      const profile = await createProfileUseCases(supabase).getByAuthUserId({ authUserId: claimsId });
      const organizations = await createOrganizationUseCases(supabase).listOrganizationsForUserId({ userId: profile.id });
      const org = organizations.find((candidate) => candidate.id === c.req.param('id'));

      if (!org) {
        throw ApiError.organizationNotFound();
      }

      return successJson(c, org);
    })
    .patch(paths.byId.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId } = orgParamsSchema.parse({ orgId: c.req.param('id') });
      const body = updateOrgSchema.parse(await c.req.json());
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));

      try {
        const organization = await organizationUseCases.updateOrganization({
          orgId,
          actorAuthUserId: claimsId,
          input: body,
        });

        return successJson(c, organization);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .delete(paths.byId.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId } = orgParamsSchema.parse({ orgId: c.req.param('id') });
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));

      try {
        const organization = await organizationUseCases.deleteOrganization({ orgId, actorAuthUserId: claimsId });

        return successJson(c, organization);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .post(paths.list.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const body = createOrgSchema.parse(await c.req.json());
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));
      try {
        const organization = await organizationUseCases.createOrganization({ actorAuthUserId: claimsId, input: body });

        return successJson(c, organization, 201);
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          'message' in error &&
          typeof (error as { code: unknown }).code === 'string'
        ) {
          throw ApiError.badRequest('Could not create organisation', {
            reason: String((error as { message: unknown }).message),
          });
        }
        mapDomainError(error);
      }
    })
    .get(paths.memberById.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId, memberId } = orgMemberParamsSchema.parse({
        orgId: c.req.param('orgId'),
        memberId: c.req.param('memberId'),
      });
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));

      try {
        const member = await organizationUseCases.getMember({ orgId, memberId, actorAuthUserId: claimsId });

        return successJson(c, member);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .patch(paths.memberById.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId, memberId } = orgMemberParamsSchema.parse({
        orgId: c.req.param('orgId'),
        memberId: c.req.param('memberId'),
      });
      const body = updateMemberSchema.parse(await c.req.json());
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));

      try {
        const member = await organizationUseCases.updateMember({ orgId, memberId, actorAuthUserId: claimsId, input: body });

        return successJson(c, member);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .delete(paths.memberById.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId, memberId } = orgMemberParamsSchema.parse({
        orgId: c.req.param('orgId'),
        memberId: c.req.param('memberId'),
      });
      const organizationUseCases = createOrganizationUseCases(getUserSupabaseClient(c));

      try {
        const member = await organizationUseCases.removeMember({ orgId, memberId, actorAuthUserId: claimsId });

        return successJson(c, member);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .get(paths.projects.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId } = orgProjectsParamsSchema.parse({ orgId: c.req.param('orgId') });

      const supabase = getUserSupabaseClient(c);
      const projectUseCases = createProjectUseCases(supabase);

      const profile = await createProfileUseCases(supabase).getByAuthUserId({ authUserId: claimsId });

      const organizations = await createOrganizationUseCases(supabase).listOrganizationsForUserId({ userId: profile.id });

      if (!organizations.some((organization) => organization.id === orgId)) {
        throw ApiError.organizationNotFound();
      }

      const projectMemberships = await projectUseCases.listProjectMembershipsForUserId({ userId: profile.id, orgId });
      const projects = await projectUseCases.listAccessibleProjectsForUserId({ userId: profile.id, orgId });

      return successJson(
        c,
        projects.filter((project) => projectMemberships.some((membership) => membership.projectId === project.id)),
      );
    })
    .post(paths.projects.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

      const { orgId } = orgProjectsParamsSchema.parse({ orgId: c.req.param('orgId') });
      const body = createOrgProjectSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const project = await projectUseCases.createProject({ orgId, actorAuthUserId: claimsId, input: body });

        return successJson(c, project, 201);
      } catch (error) {
        mapDomainError(error);
      }
    });
}

export type AppType = ReturnType<typeof createOrgsRoutes>;
