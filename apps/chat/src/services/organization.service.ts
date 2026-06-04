import { getOrgsByOrgIdProjects, postOrgs, type ApiClient } from '@aida/api-client';
import { successEnvelopeSchema } from '@aida/contracts';
import { organizationsRowSchema, projectsRowSchema, type OrganizationsRow, type ProjectsRow } from '@aida/db';
import { z } from 'zod';

import { getApiGatewayClient } from '@/lib/api/gatewayClient';

import { toApiErrorMessage } from './lib/chatApi.shared';

const createOrganizationResponseSchema = successEnvelopeSchema(organizationsRowSchema);
const orgProjectsSchema = successEnvelopeSchema(z.array(projectsRowSchema));

export type CreateOrganizationInput = {
    name: string;
    slug: string;
    dataRegion?: string;
    defaultLocale?: string;
};

export class OrganizationService {
    static async create(
        input: CreateOrganizationInput,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<OrganizationsRow> {
        const request = {
            client: api,
            body: {
                name: input.name,
                slug: input.slug,
                dataRegion: input.dataRegion ?? 'default',
                defaultLocale: input.defaultLocale ?? 'en-US',
            },
        } as unknown as Parameters<typeof postOrgs>[0];

        let result: { data: unknown; error: unknown; response: Response };
        try {
            result = (await postOrgs(request)) as { data: unknown; error: unknown; response: Response };
        } catch {
            throw new Error('Could not create your organisation. Please try again.');
        }
        const { data, error, response } = result;

        if (!response.ok) {
            throw new Error(
                await toApiErrorMessage(error, response, 'Could not create your organisation. Please try again.'),
            );
        }

        return createOrganizationResponseSchema.parse(data).data;
    }

    static async listProjects(orgId: string, api: ApiClient = getApiGatewayClient()): Promise<ProjectsRow[]> {
        const { data, error, response } = await getOrgsByOrgIdProjects({
            client: api,
            path: { orgId },
        });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load work items for this business.'));
        }

        return orgProjectsSchema.parse(data).data;
    }
}
