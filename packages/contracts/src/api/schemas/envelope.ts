import { z } from 'zod';

import { requestIdSchema } from './common';
import { apiErrorSchema } from './errors';

export function successEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
    return z.object({
        success: z.literal(true),
        data: dataSchema,
        requestId: requestIdSchema,
    });
}

export const failureEnvelopeSchema = z.object({
    success: z.literal(false),
    error: apiErrorSchema,
    requestId: requestIdSchema,
});

export type FailureEnvelope = z.infer<typeof failureEnvelopeSchema>;

export type SuccessEnvelope<T> = {
    success: true;
    data: T;
    requestId: string;
};
