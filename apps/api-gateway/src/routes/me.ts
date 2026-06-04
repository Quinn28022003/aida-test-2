import type { MeContext, ResolvedMeContext } from '@aida/profiles';
import { API_PATHS } from '@aida/contracts';
import { successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import { createProfileUseCases } from '../composition/profiles';
import type { AppVariables } from '../context.types';
import { getUserSupabaseClient } from '../supabase/context';
import { getRequiredUserClaimsId } from '../utils/route';

function toMeRouteResponse(me: ResolvedMeContext): MeContext {
  return {
    agents: me.agents,
    conversations: me.conversations,
    jobs: me.jobs,
    memberships: me.memberships,
    organizations: me.organizations,
    projects: me.projects,
  };
}

export function createMeRoutes() {
  const paths = API_PATHS.me.children;

  return new Hono<{ Variables: AppVariables }>().get(paths.current.path, async (c) => {
    const claimsId = getRequiredUserClaimsId(c);

    const supabase = getUserSupabaseClient(c);
    const profileUseCases = createProfileUseCases(supabase);
    const me = await profileUseCases.getMeContext({ authUserId: claimsId });

    return successJson(c, toMeRouteResponse(me));
  });
}

export type AppType = ReturnType<typeof createMeRoutes>;
