import { API_PATHS } from '@aida/contracts';
import { mapDomainError, successJson } from '@aida/api-client/http';
import { Hono } from 'hono';

import { createAgentUseCases } from '../composition/agents';
import type { AppVariables } from '../context.types';
import { agentParamsSchema, agentInvitationParamsSchema, createAgentInvitationSchema, createAgentMemberSchema, createAgentSchema, revokeAgentMemberSchema, updateAgentSchema } from '../schemas/agentRoutes';
import { getUserSupabaseClient } from '../supabase/context';
import { getRequiredUserClaimsId } from '../utils/route';

export function createAgentsRoutes() {
    const paths = API_PATHS.agents.children;

    return new Hono<{ Variables: AppVariables }>()
        .get(paths.list.path, async (c) => {
            getRequiredUserClaimsId(c);

            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));
            const agents = await agentUseCases.listAgents();

            return successJson(c, agents);
        })
        .get(paths.byId.path, async (c) => {
            getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const agent = await agentUseCases.getAgent({ agentId });

                return successJson(c, agent);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .post(paths.list.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const body = createAgentSchema.parse(await c.req.json());
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const agent = await agentUseCases.createAgent({
                    actorAuthUserId: claimsId,
                    input: body,
                });

                return successJson(c, agent, 201);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .patch(paths.byId.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const body = updateAgentSchema.parse(await c.req.json());
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const agent = await agentUseCases.updateAgent({
                    agentId,
                    actorAuthUserId: claimsId,
                    input: body,
                });

                return successJson(c, agent);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .delete(paths.byId.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const agent = await agentUseCases.deleteAgent({
                    agentId,
                    actorAuthUserId: claimsId,
                });

                return successJson(c, agent);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .get(paths.versions.path, async (c) => {
            getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const versions = await agentUseCases.listAgentVersions({ agentId });

                return successJson(c, versions);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .get(paths.members.path, async (c) => {
            getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const members = await agentUseCases.listAgentMembers({ agentId });

                return successJson(c, members);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .post(paths.members.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const body = createAgentMemberSchema.parse(await c.req.json());
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const member = await agentUseCases.addAgentMember({
                    agentId,
                    actorAuthUserId: claimsId,
                    input: body,
                });

                return successJson(c, member, 201);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .delete(paths.members.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const body = revokeAgentMemberSchema.parse(await c.req.json());
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const member = await agentUseCases.revokeAgentMember({
                    agentId,
                    actorAuthUserId: claimsId,
                    input: body,
                });

                return successJson(c, member);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .get(paths.invitations.path, async (c) => {
            getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const invitations = await agentUseCases.listAgentInvitations({ agentId });

                return successJson(c, invitations);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .get(paths.invitationById.path, async (c) => {
            getRequiredUserClaimsId(c);

            const { agentId, invitationId } = agentInvitationParamsSchema.parse({
                agentId: c.req.param('id'),
                invitationId: c.req.param('invitationId'),
            });
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const invitation = await agentUseCases.getAgentInvitation({ agentId, invitationId });

                return successJson(c, invitation);
            } catch (error) {
                mapDomainError(error);
            }
        })
        .post(paths.invitations.path, async (c) => {
            const claimsId = getRequiredUserClaimsId(c);

            const { agentId } = agentParamsSchema.parse({ agentId: c.req.param('id') });
            const body = createAgentInvitationSchema.parse(await c.req.json());
            const agentUseCases = createAgentUseCases(getUserSupabaseClient(c));

            try {
                const result = await agentUseCases.createAgentInvitation({
                    agentId,
                    actorAuthUserId: claimsId,
                    input: body,
                });

                return successJson(c, result, 201);
            } catch (error) {
                mapDomainError(error);
            }
        });
}

export type AppType = ReturnType<typeof createAgentsRoutes>;
