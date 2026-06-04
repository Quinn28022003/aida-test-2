import { API_APP_WIRING } from '@aida/contracts';
import { Hono } from 'hono';
import type { Schema } from 'hono';
import type { MergePath, MergeSchemaPath } from 'hono/types';

import type { AppVariables } from '../context.types';
import type { CreateAppOptions } from './create-app-options';
import { domainMiddlewareFactories } from './wiring';

type AppEnv = { Variables: AppVariables };

/** Each domain gets its own Hono sub-app with configured domain middleware applied. */
export function createSecuredDomain(options: CreateAppOptions) {
    const domain = new Hono<AppEnv>();

    for (const middlewareName of API_APP_WIRING.domainWrapper.middleware) {
        domain.use('*', domainMiddlewareFactories[middlewareName](options));
    }

    return domain;
}

/** Mounts a route group behind the configured secured-domain middleware wrapper. */
export function mountSecuredRoute<
    TAppSchema extends Schema,
    TAppBasePath extends string,
    TMountPath extends string,
    TRoutesSchema extends Schema,
    TRoutesBasePath extends string,
>(
    app: Hono<AppEnv, TAppSchema, TAppBasePath>,
    options: CreateAppOptions,
    mountPath: TMountPath,
    routeFactory: () => Hono<AppEnv, TRoutesSchema, TRoutesBasePath>,
): Hono<
    AppEnv,
    | TAppSchema
    | MergeSchemaPath<
          MergeSchemaPath<TRoutesSchema, typeof API_APP_WIRING.domainWrapper.innerRoutePath>,
          MergePath<TAppBasePath, TMountPath>
      >,
    TAppBasePath
> {
    const secured = createSecuredDomain(options);
    const routes = routeFactory();

    return app.route(
        mountPath,
        secured.route(API_APP_WIRING.domainWrapper.innerRoutePath, routes),
    );
}
