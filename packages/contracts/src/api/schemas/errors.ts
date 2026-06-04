import { z } from 'zod';

import { API_ERROR_CODES } from '../constants/error-codes';

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);

export const apiErrorSchema = z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
