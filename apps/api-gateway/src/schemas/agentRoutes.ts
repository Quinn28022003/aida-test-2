import {
  agentInvitationsInsertSchema,
  agentMembersInsertSchema,
  agentVersionsInsertSchema,
  agentsInsertSchema,
  agentsUpdateSchema,
} from '@aida/db';
import { z } from 'zod';

export const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

export const agentParamsSchema = z.object({
  agentId: z.uuid(),
});

export const agentInvitationParamsSchema = z.object({
  agentId: z.uuid(),
  invitationId: z.uuid(),
});

export const createAgentMemberSchema = agentMembersInsertSchema.pick({
  access: true,
}).extend({
  userId: z.uuid(),
});

export const revokeAgentMemberSchema = z.object({
  userId: z.uuid(),
});

export const createAgentInvitationSchema = agentInvitationsInsertSchema.pick({
  access: true,
  email: true,
  expiresAt: true,
}).partial({
  expiresAt: true,
});

export const agentVersionConfigSchema = agentVersionsInsertSchema.pick({
  instructions: true,
  maxOutputTokens: true,
  memoryPolicy: true,
  modelName: true,
  modelProfile: true,
  modelProvider: true,
  ragPolicy: true,
  responsePolicy: true,
  temperature: true,
  toolPolicy: true,
});

export const createAgentSchema = agentsInsertSchema
  .pick({
    description: true,
    key: true,
    name: true,
  })
  .extend({
    projectId: z.uuid(),
    visibility: z.string().optional(),
    version: agentVersionConfigSchema,
  });

export const updateAgentSchema = agentsUpdateSchema
  .pick({
    description: true,
    key: true,
    name: true,
    status: true,
  })
  .partial()
  .extend({
    version: agentVersionConfigSchema,
  });
