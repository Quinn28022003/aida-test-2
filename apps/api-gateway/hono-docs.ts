import { API_ROUTE_MOUNTS } from '@aida/contracts';

export const INTERNAL_OPENAPI_OUTPUT = './apps/api-gateway/openapi/internal.openapi.json';
export const PUBLIC_OPENAPI_OUTPUT = './apps/api-gateway/openapi/public.openapi.json';

export const OPENAPI_BASE_CONFIG = {
    tsConfigPath: './apps/api-gateway/tsconfig.json',
    openApi: {
        openapi: '3.0.0',
        info: {
            title: 'AIDA API',
            version: '1.0.0',
        },
        servers: [{ url: '/' }],
    },
};

export function createApiGroups(filter: (mount: (typeof API_ROUTE_MOUNTS)[number]) => boolean) {
    return API_ROUTE_MOUNTS.filter(filter).map((mount) => ({
        name: `${mount.domain} routes`,
        apiPrefix: mount.path,
        appTypePath: `apps/api-gateway/src/routes/${mount.domain}.ts`,
    }));
}
