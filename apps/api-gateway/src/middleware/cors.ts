import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

import type { AppVariables } from '../context.types';

/** Parses the comma-separated CORS allowlist from API gateway env config. */
export function parseCorsAllowedOrigins(raw: string): string[] {
    return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

/** Creates CORS middleware that allows only configured browser origins. */
export function createCorsMiddleware(
    allowedOrigins: string[],
): MiddlewareHandler<{ Variables: AppVariables }> {
    const allowed = new Set(allowedOrigins);

    return cors({
        origin: (origin) => (origin && allowed.has(origin) ? origin : null),
        allowHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        maxAge: 86_400,
    });
}
