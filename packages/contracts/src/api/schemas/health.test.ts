import { describe, expect, expectTypeOf, it } from 'vitest';

import { healthResponseSchema, type HealthResponse } from './health';

describe('healthResponseSchema', () => {
    const requestId = '550e8400-e29b-41d4-a716-446655440000';

    it('parses a valid success envelope', () => {
        const parsed = healthResponseSchema.parse({
            success: true,
            data: { status: 'ok', service: 'api-gateway' },
            requestId,
        });

        expect(parsed.success).toBe(true);
        expect(parsed.data.service).toBe('api-gateway');
    });

    it('exports inferred DTO types from schemas', () => {
        expectTypeOf<HealthResponse>().toEqualTypeOf<{
            success: true;
            data: { status: 'ok'; service: 'api-gateway' };
            requestId: string;
        }>();
    });
});
