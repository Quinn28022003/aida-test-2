import { API_PATHS } from '@aida/contracts';
import { successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import type { AppVariables } from '../context.types';

export function createConversationsRoutes() {
    const paths = API_PATHS.conversations.children;

    return new Hono<{ Variables: AppVariables }>()
        .get(paths.list.path, (c) => successJson(c, {}))
        .get(paths.byId.path, (c) => successJson(c, {}))
        .post(paths.list.path, (c) => successJson(c, {}, 201))
        .patch(paths.byId.path, (c) => successJson(c, {}))
        .delete(paths.byId.path, (c) => successJson(c, {}))
        .get(paths.messages.path, (c) => successJson(c, {}))
        .post(paths.messages.path, (c) => successJson(c, {}, 201))
        .get(paths.messageById.path, (c) => successJson(c, {}));
}

export type AppType = ReturnType<typeof createConversationsRoutes>;
