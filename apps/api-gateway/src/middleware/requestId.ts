import { randomUUID } from 'node:crypto';

import type { MiddlewareHandler } from 'hono';

import type { AppVariables } from '../context.types';

const REQUEST_ID_HEADER = 'x-request-id';

/** Ensures every request has an id available in context and response headers. */
export function createRequestIdMiddleware(): MiddlewareHandler<{ Variables: AppVariables }> {
    return async (c, next) => {
        const requestId = c.req.header(REQUEST_ID_HEADER) ?? randomUUID();
        c.set('requestId', requestId);

        await next();

        c.header(REQUEST_ID_HEADER, requestId);
    };
}
