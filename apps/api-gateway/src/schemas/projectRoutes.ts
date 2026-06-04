import {
    jobsInsertSchema,
    jobsUpdateSchema,
    projectMembersInsertSchema,
    projectsInsertSchema,
    projectsUpdateSchema,
} from '@aida/db';
import { z } from 'zod';

export const projectParamsSchema = z.object({
    projectId: z.uuid(),
});

export const projectJobParamsSchema = z.object({
    projectId: z.uuid(),
    jobId: z.uuid(),
});

export const createProjectSchema = projectsInsertSchema.pick({
    description: true,
    key: true,
    name: true,
});

export const updateProjectSchema = projectsUpdateSchema
    .pick({
        description: true,
        key: true,
        name: true,
        status: true,
    })
    .partial();

export const createProjectMemberSchema = projectMembersInsertSchema.pick({
    projectRole: true,
    userId: true,
});

export const deleteProjectMemberSchema = z.object({
    userId: z.uuid(),
});

export const createJobSchema = jobsInsertSchema.pick({
    customerProfileId: true,
    externalRef: true,
    metadata: true,
    status: true,
    title: true,
});

export const updateJobSchema = jobsUpdateSchema
    .pick({
        externalRef: true,
        metadata: true,
        status: true,
        title: true,
    })
    .partial();
