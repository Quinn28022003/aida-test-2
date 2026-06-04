import { createSupabaseContext } from '@supabase/server';
import { ApiError } from '@aida/api-client/http';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { ApiGatewaySupabaseAuthConfig } from '../supabase/authConfig';
import type { AidaSupabaseContext } from '../supabase/supabase-context.types';
import type { AppVariables } from '../context.types';

/** Supabase auth adapter config accepted by the API gateway auth middleware. */
export type SupabaseAuthMiddlewareConfig = ApiGatewaySupabaseAuthConfig;

/** Verifies Supabase request credentials and sets `supabaseContext` on the context. */
export function createSupabaseAuthMiddleware(
    config?: SupabaseAuthMiddlewareConfig,
): MiddlewareHandler<{ Variables: AppVariables }> {
    const authConfig = {
        auth: 'user',
        ...config,
    } satisfies SupabaseAuthMiddlewareConfig;

    return async (c, next) => {
        if (c.get('supabaseContext')) {
            await next();
            return;
        }

        const { data: context, error } = await createSupabaseContext(c.req.raw, authConfig);

        if (error) {
            throw new HTTPException(error.status as never, {
                message: error.message,
                cause: error,
            });
        }

        c.set('supabaseContext', context as AidaSupabaseContext);

        if (!context.userClaims?.id) {
            throw ApiError.unauthenticated();
        }

        await next();
    };
}
