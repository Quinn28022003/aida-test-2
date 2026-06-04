import { API_APP_WIRING } from '@aida/contracts';
import { createServerObservability } from '@aida/observability/server';
import type { ErrorHandler, MiddlewareHandler } from 'hono';

import { createErrorHandler } from '../middleware/errorHandler';
import { createRequestIdMiddleware } from '../middleware/requestId';
import { createSupabaseAuthMiddleware } from '../middleware/supabaseAuth';
import type { AppVariables } from '../context.types';
import type { CreateAppOptions } from './create-app-options';

type AppMiddleware = MiddlewareHandler<{ Variables: AppVariables }>;
type AppErrorHandler = ErrorHandler<{ Variables: AppVariables }>;

const observability = createServerObservability({ service: 'api-gateway' });

/** Root middleware applied to every API gateway route. */
export const rootMiddlewareFactories = {
    requestId: () => createRequestIdMiddleware(),
    requestLogger: () => observability.requestLogger,
} satisfies Record<(typeof API_APP_WIRING.rootMiddleware)[number], () => AppMiddleware>;

/** Error handlers selected by the API gateway wiring contract. */
export const errorHandlerFactories = {
    errorHandler: () => createErrorHandler(),
} satisfies Record<typeof API_APP_WIRING.errorHandler, () => AppErrorHandler>;

/** Domain middleware applied inside each secured route wrapper. */
export const domainMiddlewareFactories = {
    supabaseAuth: (options: CreateAppOptions) =>
        options.authMiddleware ?? createSupabaseAuthMiddleware(options.supabaseAuth),
} satisfies Record<
    (typeof API_APP_WIRING.domainWrapper.middleware)[number],
    (options: CreateAppOptions) => AppMiddleware
>;
