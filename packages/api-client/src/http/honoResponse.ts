import type { ApiErrorBody } from '@aida/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ApiResponse } from './apiResponse';

export type RequestIdVariables = {
    requestId: string;
};

export function getRequestId(c: Context<{ Variables: RequestIdVariables }>): string {
    return c.get('requestId');
}

export function successJson<T>(
    c: Context<{ Variables: RequestIdVariables }>,
    data: T,
    status: ContentfulStatusCode = 200,
) {
    return c.json(
        ApiResponse.successBody({
            data,
            requestId: getRequestId(c),
        }),
        status,
    );
}

export function failureJson(
    c: Context<{ Variables: RequestIdVariables }>,
    error: ApiErrorBody,
    status: ContentfulStatusCode,
) {
    return c.json(
        ApiResponse.errorBody({
            requestId: getRequestId(c),
            code: error.code,
            message: error.message,
            details: error.details,
        }),
        status,
    );
}
