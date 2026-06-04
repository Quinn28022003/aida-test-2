import {
    organizationMembersRowSchema,
    organizationMembersUpdateSchema,
    organizationsInsertSchema,
    organizationsUpdateSchema,
    projectsInsertSchema,
} from '@aida/db';
import { z } from 'zod';

export const orgParamsSchema = z.object({
    orgId: z.uuid(),
});

export const orgMemberParamsSchema = organizationMembersRowSchema.pick({
    orgId: true,
}).extend({
    memberId: z.uuid(),
});

export const orgProjectsParamsSchema = organizationMembersRowSchema.pick({
    orgId: true,
});

export const createOrgSchema = organizationsInsertSchema.pick({
    dataRegion: true,
    defaultLocale: true,
    name: true,
    slug: true,
});

export const updateOrgSchema = organizationsUpdateSchema
    .pick({
        dataRegion: true,
        defaultLocale: true,
        name: true,
        slug: true,
    })
    .partial();

export const updateMemberSchema = organizationMembersUpdateSchema
    .pick({
        memberType: true,
        status: true,
    })
    .partial()
    .extend({
        roleKeys: z.array(z.string().min(1)).optional(),
    });

export const createOrgProjectSchema = projectsInsertSchema.pick({
    description: true,
    key: true,
    name: true,
});
