import type { ApiPathChildren } from '../paths.types';

/** Join path segments and normalise duplicate or trailing slashes (root stays `/`). */
export function joinPath(...parts: string[]) {
    return parts.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/** URL-encode a single path parameter value for safe insertion into a route template. */
export function encodePathParam(value: string) {
    return encodeURIComponent(value);
}

/** Replace `:key` placeholders in a route template with encoded param values. */
export function fillPathTemplate(template: string, params: Record<string, string>) {
    return Object.entries(params).reduce(
        (path, [key, value]) => path.replace(`:${key}`, encodePathParam(value)),
        template,
    );
}

/** Build an absolute API path under a domain mount, optionally filling route params. */
export function domainAbsolute(domain: string, relative: string, params?: Record<string, string>) {
    const filled = params ? fillPathTemplate(relative, params) : relative;
    return joinPath(domain, filled);
}

type DomainPaths<TPaths extends Record<string, { path: string }>> = {
    readonly [K in keyof TPaths]: TPaths[K]['path'];
};

type DomainRoutePaths<TPaths extends Record<string, { children: ApiPathChildren }>> = {
    readonly [K in keyof TPaths]: {
        readonly [Route in keyof TPaths[K]['children']]: TPaths[K]['children'][Route]['path'];
    };
};

/** Map each domain key to its mount path (for app wiring and deprecated `API_DOMAINS`). */
export function createDomainPaths<TPaths extends Record<string, { path: string }>>(paths: TPaths) {
    return Object.fromEntries(
        Object.entries(paths).map(([key, value]) => [key, value.path]),
    ) as DomainPaths<TPaths>;
}

/** Map each domain to its child route paths (for route wiring and deprecated `API_DOMAIN_ROUTES`). */
export function createDomainRoutePaths<TPaths extends Record<string, { children: ApiPathChildren }>>(
    paths: TPaths,
) {
    return Object.fromEntries(
        Object.entries(paths).map(([domain, config]) => [
            domain,
            Object.fromEntries(
                Object.entries(config.children).map(([route, value]) => [route, value.path]),
            ),
        ]),
    ) as DomainRoutePaths<TPaths>;
}
