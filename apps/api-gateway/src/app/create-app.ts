import { API_APP_WIRING, API_PATHS } from '@aida/contracts';
import { Hono } from 'hono';

import { createCorsMiddleware } from '../middleware/cors';
import { createAgentsRoutes } from '../routes/agents';
import { createAuditRoutes } from '../routes/audit';
import { createAuthRoutes } from '../routes/auth';
import { createConversationsRoutes } from '../routes/conversations';
import { createPublicDocsRoutes } from '../routes/docs';
import { createHandoffsRoutes } from '../routes/handoffs';
import { createInvitationsRoutes } from '../routes/invitations';
import { createMeRoutes } from '../routes/me';
import { createMembersRoutes } from '../routes/members';
import { createMentionsRoutes } from '../routes/mentions';
import { createMessagesRoutes } from '../routes/messages';
import { createOrgsRoutes } from '../routes/orgs';
import { createProfilesRoutes } from '../routes/profiles';
import { createProjectsRoutes } from '../routes/projects';
import { createRouterRoutes } from '../routes/router';
import { createTasksRoutes } from '../routes/tasks';
import { createToolsRoutes } from '../routes/tools';
import { createVaultRoutes } from '../routes/vault';
import type { AppVariables } from '../context.types';
import type { CreateAppOptions } from './create-app-options';
import { mountSecuredRoute } from './secured-domain';
import { errorHandlerFactories, rootMiddlewareFactories } from './wiring';

export type { CreateAppOptions } from './create-app-options';

type AppEnv = { Variables: AppVariables };

/** Builds the API gateway Hono app with root middleware, error handling, and secured routes. */
export function createApp(options: CreateAppOptions = {}) {
    const app = new Hono<AppEnv>();

    if (options.corsAllowedOrigins?.length) {
        app.use('*', createCorsMiddleware(options.corsAllowedOrigins));
    }

    for (const middlewareName of API_APP_WIRING.rootMiddleware) {
        app.use('*', rootMiddlewareFactories[middlewareName]());
    }

    app.onError(errorHandlerFactories[API_APP_WIRING.errorHandler]());

    const withDocs = app.route('/docs/public', createPublicDocsRoutes());

    const withAuth = mountSecuredRoute(withDocs, options, API_PATHS.auth.path, createAuthRoutes);
    const withMe = mountSecuredRoute(withAuth, options, API_PATHS.me.path, createMeRoutes);
    const withOrgs = mountSecuredRoute(withMe, options, API_PATHS.orgs.path, createOrgsRoutes);
    const withProjects = mountSecuredRoute(withOrgs, options, API_PATHS.projects.path, createProjectsRoutes);
    const withMembers = mountSecuredRoute(
        withProjects,
        options,
        API_PATHS.members.path,
        createMembersRoutes,
    );
    const withProfiles = mountSecuredRoute(
        withMembers,
        options,
        API_PATHS.profiles.path,
        createProfilesRoutes,
    );
    const withInvitations = mountSecuredRoute(
        withProfiles,
        options,
        API_PATHS.invitations.path,
        createInvitationsRoutes,
    );
    const withConversations = mountSecuredRoute(
        withInvitations,
        options,
        API_PATHS.conversations.path,
        createConversationsRoutes,
    );
    const withMessages = mountSecuredRoute(
        withConversations,
        options,
        API_PATHS.messages.path,
        createMessagesRoutes,
    );
    const withAgents = mountSecuredRoute(
        withMessages,
        options,
        API_PATHS.agents.path,
        createAgentsRoutes,
    );
    const withRouter = mountSecuredRoute(
        withAgents,
        options,
        API_PATHS.router.path,
        createRouterRoutes,
    );
    const withMentions = mountSecuredRoute(
        withRouter,
        options,
        API_PATHS.mentions.path,
        createMentionsRoutes,
    );
    const withHandoffs = mountSecuredRoute(
        withMentions,
        options,
        API_PATHS.handoffs.path,
        createHandoffsRoutes,
    );
    const withVault = mountSecuredRoute(
        withHandoffs,
        options,
        API_PATHS.vault.path,
        createVaultRoutes,
    );
    const withTools = mountSecuredRoute(withVault, options, API_PATHS.tools.path, createToolsRoutes);
    const withTasks = mountSecuredRoute(withTools, options, API_PATHS.tasks.path, createTasksRoutes);

    return mountSecuredRoute(withTasks, options, API_PATHS.audit.path, createAuditRoutes);
}
