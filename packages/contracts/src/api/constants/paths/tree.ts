import type { ApiPathChildren, ApiPathNode } from '../../paths.types';

export const CRUD_ROUTE_CHILDREN = {
    list: {
        path: '/',
        description: 'List resources',
    },
    byId: {
        path: '/:id',
        description: 'Get a resource by ID',
    },
} as const satisfies ApiPathChildren;

export const API_PATH_TREE = {
    auth: {
        path: '/auth',
        description: 'Endpoints related to authentication',
        publicDocs: false,
        children: {
            session: {
                path: '/session',
                description: 'Get the current session',
            },
        },
    },
    me: {
        path: '/me',
        description: 'Endpoint related to the current authenticated user context',
        publicDocs: false,
        children: {
            current: {
                path: '/',
                description: 'Get the current authenticated user context',
            },
        },
    },
    orgs: {
        path: '/orgs',
        description: 'Endpoints related to organisations',
        publicDocs: false,
        children: {
            ...CRUD_ROUTE_CHILDREN,
            memberById: {
                path: '/:orgId/members/:memberId',
                description: 'Get, update, or remove an organisation member',
            },
            projects: {
                path: '/:orgId/projects',
                description: 'List or create projects for an organisation',
            },
        },
    },
    projects: {
        path: '/projects',
        description: 'Endpoints related to projects and project jobs',
        publicDocs: false,
        children: {
            list: {
                path: '/',
                description: 'List projects',
            },
            byId: {
                path: '/:projectId',
                description: 'Get or update a project by ID',
            },
            members: {
                path: '/:projectId/members',
                description: 'List, add, or remove project members',
            },
            jobs: {
                path: '/:projectId/jobs',
                description: 'List or create jobs for a project',
            },
            jobById: {
                path: '/:projectId/jobs/:jobId',
                description: 'Get or update a project job by ID',
            },
            agents: {
                path: '/:projectId/agents',
                description: 'List agents linked to a project',
            },
            jobMembers: {
                path: '/:projectId/jobs/:jobId/members',
                description: 'List members for a project job',
            },
        },
    },
    members: {
        path: '/members',
        description: 'Endpoints related to members',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    profiles: {
        path: '/profiles',
        description: 'Endpoints related to user profiles',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    invitations: {
        path: '/invitations',
        description: 'Endpoints related to invitations',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    conversations: {
        path: '/conversations',
        description: 'Endpoints related to conversations',
        publicDocs: false,
        children: {
            ...CRUD_ROUTE_CHILDREN,
            messages: {
                path: '/:id/messages',
                description: 'Get messages for a conversation',
            },
            messageById: {
                path: '/:id/messages/:messageId',
                description: 'Get a specific message within a conversation',
            },
        },
    },
    messages: {
        path: '/messages',
        description: 'Endpoints related to messages',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    agents: {
        path: '/agents',
        description: 'Endpoints related to agents',
        publicDocs: false,
        children: {
            ...CRUD_ROUTE_CHILDREN,
            members: {
                path: '/:id/members',
                description: 'List, add, or revoke agent members',
            },
            invitations: {
                path: '/:id/invitations',
                description: 'List or create agent invitations',
            },
            invitationById: {
                path: '/:id/invitations/:invitationId',
                description: 'Get an agent invitation by ID',
            },
            versions: {
                path: '/:id/versions',
                description: 'List agent versions',
            },
        },
    },
    router: {
        path: '/router',
        description: 'Endpoints related to routing',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    mentions: {
        path: '/mentions',
        description: 'Endpoints related to mentions',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    handoffs: {
        path: '/handoffs',
        description: 'Endpoints related to handoffs',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    vault: {
        path: '/vault',
        description: 'Endpoints related to vault records',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    tools: {
        path: '/tools',
        description: 'Endpoints related to tools',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    tasks: {
        path: '/tasks',
        description: 'Endpoints related to tasks',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
    audit: {
        path: '/audit',
        description: 'Endpoints related to audit records',
        publicDocs: false,
        children: CRUD_ROUTE_CHILDREN,
    },
} as const satisfies Readonly<Record<string, ApiPathNode & { children: ApiPathChildren }>>;

export type ApiPathTree = typeof API_PATH_TREE;
export type ApiPathTreeDomain = keyof ApiPathTree;

export type CrudDomain = {
    [K in ApiPathTreeDomain]: ApiPathTree[K]['children'] extends {
        list: { path: '/' };
        byId: { path: '/:id' };
    }
    ? K
    : never;
}[ApiPathTreeDomain];
