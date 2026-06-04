import { z } from 'zod';

export const requestIdSchema = z.uuid();

export const uuidSchema = z.uuid();

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    page_size: z.coerce.number().int().positive().max(100).optional(),
});

export const idParamSchema = z.object({
    id: uuidSchema,
});

export const conversationMessageParamsSchema = z.object({
    id: uuidSchema,
    messageId: uuidSchema,
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type ConversationMessageParams = z.infer<typeof conversationMessageParamsSchema>;
