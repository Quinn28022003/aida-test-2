/**
 * API path SSOT:
 * 1. API_PATHS.<domain>.path — mount path for create-app wiring.
 * 2. API_PATHS.<domain>.children.<route>.path — route path relative to domain.
 * 3. API_PATHS.<domain>.<helper> — absolute paths/builders for clients.
 */

import { createDomainPaths, createDomainRoutePaths, domainAbsolute } from '../../lib/paths';
import { API_PATH_TREE, type CrudDomain } from './tree';

function createCrudApiPaths(domain: CrudDomain) {
    const root = API_PATH_TREE[domain];
    const routes = root.children;

    return {
        list: domainAbsolute(root.path, routes.list.path),
        byId: (id: string) => domainAbsolute(root.path, routes.byId.path, { id }),
    } as const;
}

/** API paths for app wiring, route wiring, and client helpers. */
export const API_PATHS = {
    auth: {
        ...API_PATH_TREE.auth,
        session: domainAbsolute(API_PATH_TREE.auth.path, API_PATH_TREE.auth.children.session.path),
    },

    me: {
        ...API_PATH_TREE.me,
        current: domainAbsolute(API_PATH_TREE.me.path, API_PATH_TREE.me.children.current.path),
    },

    orgs: {
        ...API_PATH_TREE.orgs,
        ...createCrudApiPaths('orgs'),
        memberById: (orgId: string, memberId: string) =>
            domainAbsolute(API_PATH_TREE.orgs.path, API_PATH_TREE.orgs.children.memberById.path, {
                orgId,
                memberId,
            }),
        projects: (orgId: string) =>
            domainAbsolute(API_PATH_TREE.orgs.path, API_PATH_TREE.orgs.children.projects.path, {
                orgId,
            }),
    },

    projects: {
        ...API_PATH_TREE.projects,
        list: domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.list.path),
        byId: (projectId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.byId.path, {
                projectId,
            }),
        members: (projectId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.members.path, {
                projectId,
            }),
        jobs: (projectId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.jobs.path, {
                projectId,
            }),
        jobById: (projectId: string, jobId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.jobById.path, {
                projectId,
                jobId,
            }),
        agents: (projectId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.agents.path, {
                projectId,
            }),
        jobMembers: (projectId: string, jobId: string) =>
            domainAbsolute(API_PATH_TREE.projects.path, API_PATH_TREE.projects.children.jobMembers.path, {
                projectId,
                jobId,
            }),
    },

    conversations: {
        ...API_PATH_TREE.conversations,
        ...createCrudApiPaths('conversations'),
        messages: (conversationId: string) =>
            domainAbsolute(
                API_PATH_TREE.conversations.path,
                API_PATH_TREE.conversations.children.messages.path,
                { id: conversationId },
            ),
        messageById: (conversationId: string, messageId: string) =>
            domainAbsolute(
                API_PATH_TREE.conversations.path,
                API_PATH_TREE.conversations.children.messageById.path,
                { id: conversationId, messageId },
            ),
    },

    members: {
        ...API_PATH_TREE.members,
        ...createCrudApiPaths('members'),
    },
    profiles: {
        ...API_PATH_TREE.profiles,
        ...createCrudApiPaths('profiles'),
    },
    invitations: {
        ...API_PATH_TREE.invitations,
        ...createCrudApiPaths('invitations'),
    },
    messages: {
        ...API_PATH_TREE.messages,
        ...createCrudApiPaths('messages'),
    },
    agents: {
        ...API_PATH_TREE.agents,
        ...createCrudApiPaths('agents'),
        members: (agentId: string) =>
            domainAbsolute(API_PATH_TREE.agents.path, API_PATH_TREE.agents.children.members.path, {
                id: agentId,
            }),
        invitations: (agentId: string) =>
            domainAbsolute(API_PATH_TREE.agents.path, API_PATH_TREE.agents.children.invitations.path, {
                id: agentId,
            }),
        invitationById: (agentId: string, invitationId: string) =>
            domainAbsolute(
                API_PATH_TREE.agents.path,
                API_PATH_TREE.agents.children.invitationById.path,
                { id: agentId, invitationId },
            ),
        versions: (agentId: string) =>
            domainAbsolute(API_PATH_TREE.agents.path, API_PATH_TREE.agents.children.versions.path, {
                id: agentId,
            }),
    },
    router: {
        ...API_PATH_TREE.router,
        ...createCrudApiPaths('router'),
    },
    mentions: {
        ...API_PATH_TREE.mentions,
        ...createCrudApiPaths('mentions'),
    },
    handoffs: {
        ...API_PATH_TREE.handoffs,
        ...createCrudApiPaths('handoffs'),
    },
    vault: {
        ...API_PATH_TREE.vault,
        ...createCrudApiPaths('vault'),
    },
    tools: {
        ...API_PATH_TREE.tools,
        ...createCrudApiPaths('tools'),
    },
    tasks: {
        ...API_PATH_TREE.tasks,
        ...createCrudApiPaths('tasks'),
    },
    audit: {
        ...API_PATH_TREE.audit,
        ...createCrudApiPaths('audit'),
    },
} as const;

export const API_ROUTE_MOUNTS = Object.entries(API_PATH_TREE).map(([domain, config]) => ({
    domain,
    path: config.path,
    publicDocs: config.publicDocs,
})) as {
    readonly [K in keyof typeof API_PATH_TREE]: {
        readonly domain: K;
        readonly path: (typeof API_PATH_TREE)[K]['path'];
        readonly publicDocs: (typeof API_PATH_TREE)[K]['publicDocs'];
    };
}[keyof typeof API_PATH_TREE][];

export const API_APP_WIRING = {
    honoVariablesType: 'AppVariables',
    rootMiddleware: ['requestId', 'requestLogger'],
    errorHandler: 'errorHandler',
    domainWrapper: {
        kind: 'securedDomain',
        innerRoutePath: '/',
        middleware: ['supabaseAuth'],
    },
} as const;

/** @deprecated Use API_PATHS.<domain>.path */
export const API_DOMAINS = createDomainPaths(API_PATHS);

/** @deprecated Use API_PATHS.<domain>.path */
export const API_MOUNT_PATHS = API_DOMAINS;

/** @deprecated Use API_PATHS.<domain>.children.<route>.path */
export const API_DOMAIN_ROUTES = createDomainRoutePaths(API_PATHS);
