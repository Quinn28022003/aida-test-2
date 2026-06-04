import {
    getProjectsByProjectIdAgents,
    getProjectsByProjectIdJobs,
    getProjectsByProjectIdJobsByJobIdMembers,
    getProjectsByProjectIdMembers,
    postOrgsByOrgIdProjects,
    postProjectsByProjectIdJobs,
    type ApiClient,
} from '@aida/api-client';
import { successEnvelopeSchema, type TProjectAgentListItem } from '@aida/contracts';
import {
    agentVersionsRowSchema,
    agentsRowSchema,
    jobMembersRowSchema,
    jobsRowSchema,
    projectAgentsRowSchema,
    projectMembersRowSchema,
    projectsRowSchema,
    type JobMembersRow,
    type JobsRow,
    type ProjectMembersRow,
    type ProjectsRow,
} from '@aida/db';
import { z } from 'zod';

import { getApiGatewayClient } from '@/lib/api/gatewayClient';

import { toApiErrorMessage } from './lib/chatApi.shared';

const createProjectResponseSchema = successEnvelopeSchema(projectsRowSchema);
const createJobResponseSchema = successEnvelopeSchema(jobsRowSchema);
const projectJobsSchema = successEnvelopeSchema(z.array(jobsRowSchema));
const projectMembersSchema = successEnvelopeSchema(z.array(projectMembersRowSchema));
const projectJobMembersSchema = successEnvelopeSchema(z.array(jobMembersRowSchema));
const projectAgentsSchema = successEnvelopeSchema(
    z.array(
        z.object({
            projectAgent: projectAgentsRowSchema,
            agent: agentsRowSchema,
            activeVersion: agentVersionsRowSchema.nullable(),
        }),
    ),
);

export type CreateProjectInput = {
    orgId: string;
    name: string;
    key: string;
    description?: string;
};

export type CreateJobInput = {
    projectId: string;
    title: string;
    customerProfileId: string;
};

export type CreateConversationInput = {
    orgId: string;
    projectId: string;
    jobId: string;
    title: string;
};

export type CreateConversationResult = Record<string, never>;

export class ProjectService {
    static async create(input: CreateProjectInput, api: ApiClient = getApiGatewayClient()): Promise<ProjectsRow> {
        const request = {
            client: api,
            path: { orgId: input.orgId },
            body: {
                name: input.name,
                key: input.key,
                description: input.description,
            },
        } as unknown as Parameters<typeof postOrgsByOrgIdProjects>[0];
        const { data, error, response } = (await postOrgsByOrgIdProjects(request)) as {
            data: unknown;
            error: unknown;
            response: Response;
        };

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not create the project.'));
        }

        return createProjectResponseSchema.parse(data).data;
    }

    static async createJob(input: CreateJobInput, api: ApiClient = getApiGatewayClient()): Promise<JobsRow> {
        const request = {
            client: api,
            path: { projectId: input.projectId },
            body: {
                title: input.title,
                customerProfileId: input.customerProfileId,
            },
        } as unknown as Parameters<typeof postProjectsByProjectIdJobs>[0];
        const { data, error, response } = (await postProjectsByProjectIdJobs(request)) as {
            data: unknown;
            error: unknown;
            response: Response;
        };

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not create the job ticket.'));
        }

        return createJobResponseSchema.parse(data).data;
    }

    static async listJobs(projectId: string, api: ApiClient = getApiGatewayClient()): Promise<JobsRow[]> {
        const { data, error, response } = await getProjectsByProjectIdJobs({
            client: api,
            path: { projectId },
        });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load jobs for this project.'));
        }

        return projectJobsSchema.parse(data).data;
    }

    static async listMembers(
        projectId: string,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<ProjectMembersRow[]> {
        const { data, error, response } = await getProjectsByProjectIdMembers({
            client: api,
            path: { projectId },
        });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load project members.'));
        }

        return projectMembersSchema.parse(data).data;
    }

    static async listAgents(
        projectId: string,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<TProjectAgentListItem[]> {
        const { data, error, response } = await getProjectsByProjectIdAgents({
            client: api,
            path: { projectId },
        });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load project agents.'));
        }

        return projectAgentsSchema.parse(data).data;
    }

    static async listJobMembers(
        projectId: string,
        jobId: string,
        api: ApiClient = getApiGatewayClient(),
    ): Promise<JobMembersRow[]> {
        const { data, error, response } = await getProjectsByProjectIdJobsByJobIdMembers({
            client: api,
            path: { projectId, jobId },
        });

        if (!response.ok) {
            throw new Error(await toApiErrorMessage(error, response, 'Could not load job members.'));
        }

        return projectJobMembersSchema.parse(data).data;
    }

    static async createConversation(_input: CreateConversationInput): Promise<CreateConversationResult> {
        void _input;
        return {};
    }
}
