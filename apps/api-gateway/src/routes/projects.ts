import { API_PATHS } from '@aida/contracts';
import { ApiError, mapDomainError, successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import { createProfileUseCases } from '../composition/profiles';
import { createAgentUseCases } from '../composition/agents';
import { createProjectUseCases } from '../composition/projects';
import type { AppVariables } from '../context.types';
import {
  createJobSchema,
  createProjectMemberSchema,
  deleteProjectMemberSchema,
  projectJobParamsSchema,
  projectParamsSchema,
  updateJobSchema,
  updateProjectSchema,
} from '../schemas/projectRoutes';
import { getUserClaims, getUserSupabaseClient } from '../supabase/context';
import { getRequiredUserClaimsId } from '../utils/route';

export function createProjectsRoutes() {
  const paths = API_PATHS.projects.children;

  const projectsRoutes = new Hono<{ Variables: AppVariables }>();

  return projectsRoutes
    .get(paths.list.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const supabase = getUserSupabaseClient(c);
      const projectUseCases = createProjectUseCases(supabase);
      const profile = await createProfileUseCases(supabase).getByAuthUserId({ authUserId: claimsId });

      const projects = await projectUseCases.listAccessibleProjectsForUserId({ userId: profile.id });

      return successJson(c, projects);
    })
    .get(paths.byId.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const project = await projectUseCases.getProject({ projectId, actorAuthUserId: claimsId });

        return successJson(c, project);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .patch(paths.byId.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const body = updateProjectSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const project = await projectUseCases.updateProject({ projectId, actorAuthUserId: claimsId, input: body });

        return successJson(c, project);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .get(paths.members.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const members = await projectUseCases.listMembers({ projectId, actorAuthUserId: claimsId });

        return successJson(c, members);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .post(paths.members.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const body = createProjectMemberSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const member = await projectUseCases.addMember({ projectId, actorAuthUserId: claimsId, input: body });

        return successJson(c, member, 201);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .delete(paths.members.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const body = deleteProjectMemberSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const member = await projectUseCases.removeMember({ projectId, actorAuthUserId: claimsId, input: body });

        return successJson(c, member);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .get(paths.jobs.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const jobs = await projectUseCases.listJobs({ projectId, actorAuthUserId: claimsId });

        return successJson(c, jobs);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .post(paths.jobs.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const body = createJobSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const job = await projectUseCases.createJob({ projectId, actorAuthUserId: claimsId, input: body });

        return successJson(c, job, 201);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .get(paths.jobById.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId, jobId } = projectJobParamsSchema.parse({
        projectId: c.req.param('projectId'),
        jobId: c.req.param('jobId'),
      });
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const job = await projectUseCases.getJob({ projectId, jobId, actorAuthUserId: claimsId });

        return successJson(c, job);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .patch(paths.jobById.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId, jobId } = projectJobParamsSchema.parse({
        projectId: c.req.param('projectId'),
        jobId: c.req.param('jobId'),
      });
      const body = updateJobSchema.parse(await c.req.json());
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const job = await projectUseCases.updateJob({ projectId, jobId, actorAuthUserId: claimsId, input: body });

        return successJson(c, job);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .get(paths.agents.path, async (c) => {
      const claimsId = getUserClaims(c)?.id;

      if (!claimsId) {
        throw ApiError.unauthenticated();
      }

      const { projectId } = projectParamsSchema.parse({ projectId: c.req.param('projectId') });
      const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

      const agents = await agentUseCases.listProjectAgents({ projectId });

      return successJson(c, agents);
    })
    .get(paths.jobMembers.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { projectId, jobId } = projectJobParamsSchema.parse({
        projectId: c.req.param('projectId'),
        jobId: c.req.param('jobId'),
      });
      const projectUseCases = createProjectUseCases(getUserSupabaseClient(c));

      try {
        const members = await projectUseCases.listJobMembers({ projectId, jobId, actorAuthUserId: claimsId });

        return successJson(c, members);
      } catch (error) {
        mapDomainError(error);
      }
    }
    );
}

export type AppType = ReturnType<typeof createProjectsRoutes>;
