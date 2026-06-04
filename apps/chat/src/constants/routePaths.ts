type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildQuerySearch(params?: QueryParams): string {
    if (!params) {
        return '';
    }

    // URLSearchParams is enough for flat params. Use qs if future routes need nested objects or arrays.
    const searchParams = new URLSearchParams(
        Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, String(value)]),
    );

    const search = searchParams.toString();

    if (!search) {
        return '';
    }

    return `?${search}`;
}

export const ROUTE_PATHS = {
    // Static routes
    HOME: '/',
    DASHBOARD: '/dashboard',
    ORGS: '/orgs',
    TEAM: '/team',
    SETTINGS: '/settings',

    // Route builders
    OrgDetail: (orgId: string): string => `/orgs/${orgId}`,
    OrgProjects: (orgId: string): string => `/orgs/${orgId}/projects`,
    ProjectWorkspace: (orgId: string, projectId: string, params?: QueryParams): string => {
        const query = buildQuerySearch(params);
        return `/orgs/${orgId}/projects/${projectId}${query}`;
    },
} as const;
