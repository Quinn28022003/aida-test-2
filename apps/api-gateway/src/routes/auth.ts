import { API_PATHS } from '@aida/contracts';
import { successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import type { AppVariables } from '../context.types';

export function createAuthRoutes() {
    return new Hono<{ Variables: AppVariables }>().get(
        API_PATHS.auth.children.session.path,
        (c) => successJson(c, { authenticated: true }),
    );
}

export type AppType = ReturnType<typeof createAuthRoutes>;
