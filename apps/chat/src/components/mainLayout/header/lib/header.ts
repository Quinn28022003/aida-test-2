import { ROUTE_PATHS } from '@/constants/routePaths';

type HeaderConfig = {
    title: string;
};

/**
 * Gets the header configuration (title) based on the current pathname.
 * Maps different routes to their appropriate header titles.
 *
 * Route mappings:
 * - /dashboard -> "Dashboard"
 * - /orgs -> "Work items"
 * - /orgs/:orgId/projects -> "Work items"
 * - /orgs/:orgId/projects/:projectId -> "Chat Workspace"
 * - /orgs/:orgId -> "Organisation"
 * - default -> "Chat"
 */
export function getHeaderConfig(pathname: string): HeaderConfig {
    if (pathname === ROUTE_PATHS.DASHBOARD) {
        return {
            title: 'Dashboard',
        };
    }

    const normalizedPath = pathname.split(/[?#]/)[0]?.replace(/\/+$/, '') ?? pathname;

    if (normalizedPath === ROUTE_PATHS.ORGS) {
        return {
            title: 'Work items',
        };
    }

    if (/^\/orgs\/[^/]+\/projects$/.test(normalizedPath)) {
        return {
            title: 'Work items',
        };
    }

    const workspaceMatch = pathname.match(/^\/orgs\/([^/]+)\/projects\/([^/]+)$/);
    if (workspaceMatch) {
        return {
            title: 'Chat Workspace',
        };
    }

    const orgMatch = pathname.match(/^\/orgs\/([^/]+)$/);
    if (orgMatch) {
        return {
            title: 'Organisation',
        };
    }

    return {
        title: 'Chat',
    };
}

/**
 * Extracts workspace route parameters from pathname and params.
 * Matches routes like: /orgs/:orgId/projects/:projectId
 *
 * @param pathname - Current URL pathname
 * @param params - Optional params object that may contain orgId and projectId
 * @returns Object with orgId and projectId, or null if not a workspace route
 */
export function getWorkspaceRouteParams(pathname: string, params: { orgId?: string; projectId?: string }) {
    const match = pathname.match(/^\/orgs\/([^/]+)\/projects\/([^/]+)$/);
    if (!match) {
        return null;
    }

    const orgId = params.orgId ?? match[1];
    const projectId = params.projectId ?? match[2];

    if (!orgId || !projectId) {
        return null;
    }

    return { orgId, projectId };
}
