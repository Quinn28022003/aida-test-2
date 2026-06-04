import { describe, expect, it } from 'vitest';

import { failureEnvelopeSchema } from './envelope';

describe('failureEnvelopeSchema', () => {
    const requestId = '550e8400-e29b-41d4-a716-446655440000';

    it('parses a valid failure envelope', () => {
        const parsed = failureEnvelopeSchema.parse({
            success: false,
            error: {
                code: 'auth.unauthenticated',
                message: 'Authentication required',
            },
            requestId,
        });

        expect(parsed.success).toBe(false);
        expect(parsed.error.code).toBe('auth.unauthenticated');
    });
});
