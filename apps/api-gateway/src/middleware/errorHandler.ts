import type { ErrorHandler } from 'hono';
import type { ZodError } from 'zod';

import { ApiError, failureJson } from '@aida/api-client/http';
import { HTTPException } from 'hono/http-exception';

import type { AppVariables } from '../context.types';

/** Detects Zod validation errors without importing Zod runtime classes into route code. */
function isZodError(error: unknown): error is ZodError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'issues' in error &&
        Array.isArray((error as ZodError).issues)
    );
}

/** Converts thrown route errors into the API gateway failure envelope. */
export function createErrorHandler(): ErrorHandler<{ Variables: AppVariables }> {
    return (error, c) => {
        const requestId = c.get('requestId') ?? crypto.randomUUID();

        console.log('Error occurred:', { requestId, error });

        if (!c.get('requestId')) {
            c.set('requestId', requestId);
        }

        if (error instanceof ApiError) {
            return failureJson(
                c,
                {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                },
                error.status,
            );
        }

        if (error instanceof HTTPException && error.status === 401) {
            return failureJson(
                c,
                {
                    code: 'auth.unauthenticated',
                    message: error.message,
                },
                401,
            );
        }

        if (isZodError(error)) {
            return failureJson(
                c,
                {
                    code: 'request.invalid',
                    message: 'Request validation failed',
                    details: {
                        issues: error.issues.map((issue) => ({
                            path: issue.path.join('.'),
                            message: issue.message,
                        })),
                    },
                },
                400,
            );
        }

        console.error('[api-gateway] unhandled error', { requestId, error });

        return failureJson(
            c,
            {
                code: 'internal.error',
                message: 'An unexpected error occurred',
            },
            500,
        );
    };
}
