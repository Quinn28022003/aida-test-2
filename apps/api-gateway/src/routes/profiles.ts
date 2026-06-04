import { API_PATHS } from '@aida/contracts';
import { ApiError, mapDomainError, successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import { createProfileUseCases } from '../composition/profiles';
import type { AppVariables } from '../context.types';
import { profileByIdParamsSchema } from '../schemas/profileByIdParams';
import { getUserSupabaseClient } from '../supabase/context';
import { getRequiredUserClaimsId } from '../utils/route';

export function createProfilesRoutes() {
  const paths = API_PATHS.profiles.children;

  const profilesRoutes = new Hono<{ Variables: AppVariables }>();

  return profilesRoutes
    .get(paths.list.path, (c) => successJson(c, {}))
    .get(paths.byId.path, async (c) => {
      const claimsId = getRequiredUserClaimsId(c);

      const { id: requestedAuthUserId } = profileByIdParamsSchema.parse({ id: c.req.param('id') });

      if (requestedAuthUserId !== claimsId) {
        throw ApiError.forbidden();
      }

      const supabase = getUserSupabaseClient(c);
      const profileUseCases = createProfileUseCases(supabase);

      try {
        const profile = await profileUseCases.getByAuthUserId({ authUserId: claimsId });

        return successJson(c, profile);
      } catch (error) {
        mapDomainError(error);
      }
    })
    .post(paths.list.path, (c) => successJson(c, {}, 201))
    .patch(paths.byId.path, (c) => successJson(c, {}))
    .delete(paths.byId.path, (c) => successJson(c, {}));
}

export type AppType = ReturnType<typeof createProfilesRoutes>;
