import { describe, expect, it } from 'vitest';

import { toApiErrorMessage } from './chatApi.shared';

const requestId = '00000000-0000-4000-8000-000000000099';

describe('toApiErrorMessage', () => {
    it('returns the failure envelope message', async () => {
        await expect(
            toApiErrorMessage(
                {
                    success: false,
                    error: {
                        code: 'request.invalid',
                        message: 'Request validation failed',
                    },
                    requestId,
                },
                new Response(null, { status: 400 }),
                'Fallback',
            ),
        ).resolves.toBe('Request validation failed');
    });

    it('appends details.reason when present', async () => {
        await expect(
            toApiErrorMessage(
                {
                    success: false,
                    error: {
                        code: 'request.invalid',
                        message: 'Could not create organisation',
                        details: { reason: 'duplicate slug' },
                    },
                    requestId,
                },
                new Response(null, { status: 400 }),
                'Fallback',
            ),
        ).resolves.toBe('Could not create organisation: duplicate slug');
    });

    it('returns the fallback for malformed response bodies', async () => {
        await expect(
            toApiErrorMessage(null, new Response('{', { status: 500 }), 'Fallback message'),
        ).resolves.toBe('Fallback message');
    });
});
