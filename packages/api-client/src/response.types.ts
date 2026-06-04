import type { ApiErrorBody, ApiErrorCode } from '@aida/contracts';

/** Options for a successful API response body or `Response`. */
export type SuccessResponseOptions<T> = {
    data: T;
    requestId: string;
    status?: number;
};

/** Options for a failed API response body or `Response`. */
export type ErrorResponseOptions = {
    requestId: string;
    code: ApiErrorCode;
    message: string;
    status?: number;
    details?: Record<string, unknown>;
    /** Logged in development only; never included in the response body. */
    cause?: unknown;
};

export type { ApiErrorBody, ApiErrorCode };
