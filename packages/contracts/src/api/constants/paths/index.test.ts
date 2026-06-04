import { describe, expect, it } from 'vitest';

import {
    API_APP_WIRING,
    API_DOMAINS,
    API_DOMAIN_ROUTES,
    API_MOUNT_PATHS,
    API_PATHS,
    API_ROUTE_MOUNTS,
} from './index';

describe('API path constants', () => {
    it('exposes flexible path tree metadata', () => {
        expect(API_PATHS.conversations.path).toBe('/conversations');
        expect(API_PATHS.conversations.description).toBe('Endpoints related to conversations');
        expect(API_PATHS.conversations.children.list.path).toBe('/');
        expect(API_PATHS.conversations.children.byId.path).toBe('/:id');
        expect(API_PATHS.conversations.children.messages.path).toBe('/:id/messages');
        expect(API_PATHS.conversations.children.messageById.path).toBe(
            '/:id/messages/:messageId',
        );
        expect(API_PATHS.conversations.children.messageById.description).toBe(
            'Get a specific message within a conversation',
        );
        expect('children' in API_PATHS.conversations).toBe(true);
        expect('description' in API_PATHS.conversations).toBe(true);
        expect('chidren' in API_PATHS.conversations).toBe(false);
        expect('descrtiption' in API_PATHS.conversations).toBe(false);
    });

    it('keeps compatibility domain mount paths derived from the tree', () => {
        expect(API_DOMAINS.orgs).toBe('/orgs');
        expect(API_DOMAINS.conversations).toBe('/conversations');
        expect(API_MOUNT_PATHS.agents).toBe('/agents');
    });

    it('keeps compatibility per-domain route paths derived from children', () => {
        expect(API_DOMAIN_ROUTES.me.current).toBe('/');
        expect(API_DOMAIN_ROUTES.conversations.list).toBe('/');
        expect(API_DOMAIN_ROUTES.conversations.byId).toBe('/:id');
        expect(API_DOMAIN_ROUTES.conversations.messages).toBe('/:id/messages');
        expect(API_DOMAIN_ROUTES.auth.session).toBe('/session');
        expect(API_DOMAIN_ROUTES.orgs.memberById).toBe('/:orgId/members/:memberId');
        expect(API_DOMAIN_ROUTES.projects.jobById).toBe('/:projectId/jobs/:jobId');
        expect(API_DOMAIN_ROUTES.projects.jobMembers).toBe('/:projectId/jobs/:jobId/members');
    });

    it('exposes backend route wiring metadata in app mount order', () => {
        expect(API_ROUTE_MOUNTS.map((mount) => mount.domain)).toEqual([
            'auth',
            'me',
            'orgs',
            'projects',
            'members',
            'profiles',
            'invitations',
            'conversations',
            'messages',
            'agents',
            'router',
            'mentions',
            'handoffs',
            'vault',
            'tools',
            'tasks',
            'audit',
        ]);
        expect(API_ROUTE_MOUNTS[0]).toEqual({
            domain: 'auth',
            path: '/auth',
            publicDocs: false,
        });
        expect(API_ROUTE_MOUNTS[7]).toEqual({
            domain: 'conversations',
            path: '/conversations',
            publicDocs: false,
        });
        expect(API_ROUTE_MOUNTS.every((mount) => typeof mount.publicDocs === 'boolean')).toBe(true);
    });

    it('exposes app wiring metadata for type generation', () => {
        expect(API_APP_WIRING).toEqual({
            honoVariablesType: 'AppVariables',
            rootMiddleware: ['requestId', 'requestLogger'],
            errorHandler: 'errorHandler',
            domainWrapper: {
                kind: 'securedDomain',
                innerRoutePath: '/',
                middleware: ['supabaseAuth'],
            },
        });
    });

    it('exposes stable client paths', () => {
        expect(API_PATHS.auth.session).toBe('/auth/session');
        expect(API_PATHS.me.current).toBe('/me');
        expect(API_PATHS.orgs.list).toBe('/orgs');
        expect(API_PATHS.orgs.byId('abc')).toBe('/orgs/abc');
        expect(API_PATHS.orgs.memberById('org-1', 'member-1')).toBe('/orgs/org-1/members/member-1');
        expect(API_PATHS.projects.byId('project-1')).toBe('/projects/project-1');
        expect(API_PATHS.projects.members('project-1')).toBe('/projects/project-1/members');
        expect(API_PATHS.projects.jobs('project-1')).toBe('/projects/project-1/jobs');
        expect(API_PATHS.projects.agents('project-1')).toBe('/projects/project-1/agents');
        expect(API_PATHS.agents.members('agent-1')).toBe('/agents/agent-1/members');
        expect(API_PATHS.agents.invitations('agent-1')).toBe('/agents/agent-1/invitations');
        expect(API_PATHS.agents.invitationById('agent-1', 'invite-1')).toBe(
            '/agents/agent-1/invitations/invite-1',
        );
        expect(API_PATHS.projects.jobMembers('project-1', 'job-1')).toBe('/projects/project-1/jobs/job-1/members');

        expect(API_PATHS.agents.versions('agent-1')).toBe('/agents/agent-1/versions');
        expect(API_PATHS.members.byId('def')).toBe('/members/def');
    });

    it('encodes path parameters in client path builders', () => {
        expect(API_PATHS.orgs.byId('a/b')).toBe('/orgs/a%2Fb');
        expect(API_PATHS.orgs.projects('a/b')).toBe('/orgs/a%2Fb/projects');
        expect(API_PATHS.projects.jobById('project/1', 'job/1')).toBe('/projects/project%2F1/jobs/job%2F1');
        expect(API_PATHS.conversations.messages('c1')).toBe('/conversations/c1/messages');
        expect(API_PATHS.conversations.messageById('c1', 'm/1')).toBe(
            '/conversations/c1/messages/m%2F1',
        );
    });

    it.each([
        ['members', '/members'],
        ['profiles', '/profiles'],
        ['invitations', '/invitations'],
        ['agents', '/agents'],
        ['tasks', '/tasks'],
    ] as const)('exposes CRUD client paths for %s', (key, mount) => {
        const paths = API_PATHS[key];
        expect(paths.list).toBe(mount);
        expect(paths.byId('id-1')).toBe(`${mount}/id-1`);
    });
});
