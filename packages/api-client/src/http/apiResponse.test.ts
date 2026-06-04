import { describe, expect, it, vi } from 'vitest';

import { ApiResponse } from './apiResponse';

const requestId = '550e8400-e29b-41d4-a716-446655440000';

describe('ApiResponse', () => {
    it('returns a success envelope', async () => {
        const response = ApiResponse.success({
            requestId,
            data: { status: 'ok' },
        });

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body).toEqual({
            success: true,
            data: { status: 'ok' },
            requestId,
        });
    });

    it('returns a failure envelope with contract error codes', async () => {
        const response = ApiResponse.unauthorized(requestId);

        expect(response.status).toBe(401);

        const body = await response.json();

        expect(body).toEqual({
            success: false,
            error: {
                code: 'auth.unauthenticated',
                message: 'Authentication required',
            },
            requestId,
        });
    });

    it('logs cause in development without exposing it in the response', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const response = ApiResponse.internal(requestId, 'An unexpected error occurred', new Error('boom'));

        const body = await response.json();

        expect(consoleSpy).toHaveBeenCalled();
        expect(body.error).toEqual({
            code: 'internal.error',
            message: 'An unexpected error occurred',
        });
        expect(body).not.toHaveProperty('cause');

        vi.unstubAllEnvs();
        consoleSpy.mockRestore();
    });
});
