import type { FailureEnvelope, SuccessEnvelope } from '@aida/contracts';

import type { ErrorResponseOptions, SuccessResponseOptions } from '../response.types';

function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

export class ApiResponse {
    static successBody<T>(options: SuccessResponseOptions<T>): SuccessEnvelope<T> {
        return {
            success: true,
            data: options.data,
            requestId: options.requestId,
        };
    }

    static errorBody(options: ErrorResponseOptions): FailureEnvelope {
        const error = {
            code: options.code,
            message: options.message,
            ...(options.details ? { details: options.details } : {}),
        };

        return {
            success: false,
            error,
            requestId: options.requestId,
        };
    }

    static success<T>(options: SuccessResponseOptions<T>): Response {
        const { status = 200 } = options;

        return Response.json(this.successBody(options), { status });
    }

    static error(options: ErrorResponseOptions): Response {
        const { status = 500, message, cause } = options;

        if (isDevelopment() && cause !== undefined) {
            console.error(`[API Error ${status}]`, { message, cause });
        }

        return Response.json(this.errorBody(options), { status });
    }

    static unauthorized(
        requestId: string,
        message = 'Authentication required',
        options: Omit<ErrorResponseOptions, 'requestId' | 'code' | 'message' | 'status'> = {},
    ) {
        return this.error({
            requestId,
            code: 'auth.unauthenticated',
            message,
            status: 401,
            ...options,
        });
    }

    static forbidden(
        requestId: string,
        message = 'Forbidden',
        options: Omit<ErrorResponseOptions, 'requestId' | 'code' | 'message' | 'status'> = {},
    ) {
        return this.error({
            requestId,
            code: 'auth.forbidden',
            message,
            status: 403,
            ...options,
        });
    }

    static badRequest(
        requestId: string,
        message = 'Request validation failed',
        details?: Record<string, unknown>,
        cause?: unknown,
    ) {
        return this.error({
            requestId,
            code: 'request.invalid',
            message,
            status: 400,
            details,
            cause,
        });
    }

    static notFound(requestId: string, message = 'Resource not found') {
        return this.error({
            requestId,
            code: 'request.invalid',
            message,
            status: 404,
        });
    }

    static internal(
        requestId: string,
        message = 'An unexpected error occurred',
        cause?: unknown,
    ) {
        return this.error({
            requestId,
            code: 'internal.error',
            message,
            status: 500,
            cause,
        });
    }
}
