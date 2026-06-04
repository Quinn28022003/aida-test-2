export type ApiPathNode = Readonly<{
    path: string;
    description: string;
    publicDocs?: boolean;
    children?: ApiPathChildren;
}>;

export type ApiPathChildren = Readonly<Record<string, ApiPathNode>>;

export type ApiPaths = typeof import('./constants/paths').API_PATHS;
export type ApiDomain = keyof ApiPaths;
export type ApiDomainPath = ApiPaths[ApiDomain]['path'];

/** @deprecated Use ApiDomainPath */
export type ApiMountPath = ApiDomainPath;

export type ApiDomainRoutes = typeof import('./constants/paths').API_DOMAIN_ROUTES;

export type ApiRouteMount = typeof import('./constants/paths').API_ROUTE_MOUNTS[number];
export type ApiRouteMountDomain = ApiRouteMount['domain'];
export type ApiAppWiring = typeof import('./constants/paths').API_APP_WIRING;
