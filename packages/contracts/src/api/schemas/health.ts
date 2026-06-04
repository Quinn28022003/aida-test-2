import { z } from 'zod';

import { successEnvelopeSchema } from './envelope';

export const healthDataSchema = z.object({
    status: z.literal('ok'),
    service: z.literal('api-gateway'),
});

export const healthResponseSchema = successEnvelopeSchema(healthDataSchema);

export type HealthData = z.infer<typeof healthDataSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
