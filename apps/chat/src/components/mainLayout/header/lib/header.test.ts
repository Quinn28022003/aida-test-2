import { describe, expect, it } from 'vitest';

import { getHeaderConfig, getWorkspaceRouteParams } from './header';

describe('getHeaderConfig', () => {
    it.each([
        ['/dashboard', 'Dashboard'],
        ['/orgs', 'Work items'],
        ['/orgs/org-1/projects', 'Work items'],
        ['/orgs/org-1/projects/proj-1', 'Chat Workspace'],
        ['/orgs/org-1', 'Organisation'],
        ['/unknown', 'Chat'],
    ])('returns %s title mapping', (pathname, title) => {
        expect(getHeaderConfig(pathname)).toEqual({ title });
    });

    it('normalises query strings and trailing slashes for org work item routes', () => {
        expect(getHeaderConfig('/orgs/org-1/projects/?x=1')).toEqual({ title: 'Work items' });
    });
});

describe('getWorkspaceRouteParams', () => {
    it('extracts workspace params from the pathname', () => {
        expect(getWorkspaceRouteParams('/orgs/org-1/projects/proj-1', {})).toEqual({
            orgId: 'org-1',
            projectId: 'proj-1',
        });
    });

    it('prefers provided params over pathname params', () => {
        expect(
            getWorkspaceRouteParams('/orgs/org-1/projects/proj-1', {
                orgId: 'param-org',
                projectId: 'param-project',
            }),
        ).toEqual({
            orgId: 'param-org',
            projectId: 'param-project',
        });
    });

    it('returns null outside workspace routes', () => {
        expect(getWorkspaceRouteParams('/orgs/org-1/projects', {})).toBeNull();
    });
});
