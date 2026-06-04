import { getMe, getProfilesById, type ApiClient } from '@aida/api-client';
import { failureEnvelopeSchema, successEnvelopeSchema } from '@aida/contracts';
import {
    agentMembersRowSchema,
    agentsRowSchema,
    conversationMembersRowSchema,
    conversationsRowSchema,
    jobMembersRowSchema,
    jobsRowSchema,
    organizationMembersRowSchema,
    organizationsRowSchema,
    profilesRowSchema,
    projectMembersRowSchema,
    projectsRowSchema,
    type ProfilesRow,
} from '@aida/db';
import { z } from 'zod';

import { getApiGatewayClient } from '@/lib/api/gatewayClient';

import { toApiErrorMessage } from './lib/chatApi.shared';
import type { MeContext } from './types/chatApi.types';

const profileResponseSchema = successEnvelopeSchema(profilesRowSchema);
const meContextSchema = successEnvelopeSchema(
    z.object({
        organizations: z.array(organizationsRowSchema),
        projects: z.array(projectsRowSchema),
        jobs: z.array(jobsRowSchema),
        agents: z.array(agentsRowSchema),
        conversations: z.array(conversationsRowSchema),
        memberships: z.object({
            agents: z.array(agentMembersRowSchema),
            conversations: z.array(conversationMembersRowSchema),
            organizations: z.array(organizationMembersRowSchema),
            projects: z.array(projectMembersRowSchema),
            jobs: z.array(jobMembersRowSchema),
        }),
    }),
);

export type { ProfilesRow };

export class UserService {
    static async getProfileByAuthUserId(
        authUserId: string,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<ProfilesRow> {
        const { data, error, response } = await getProfilesById({
            client: api,
            path: { id: authUserId },
        });

        if (!response.ok) {
            const body = error ?? (await response.json());
            const parsed = failureEnvelopeSchema.safeParse(body);

            if (parsed.success) {
                throw new Error(parsed.data.error.message);
            }

            throw new Error('Failed to load user profile');
        }

        const parsed = profileResponseSchema.parse(data);

        return parsed.data;
    }

    static async getMeContext(api: ApiClient = getApiGatewayClient()): Promise<MeContext> {
        const { data, error, response } = await getMe({ client: api });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load your dashboard data.'));
        }

        return meContextSchema.parse(data).data;
    }
}
