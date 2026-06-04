import { describe, expect, it } from 'vitest';
import { isTransientModelError, toModelProviderError } from './errors';

describe('model provider errors', () => {
    it('classifies provider 429 and 5xx as transient', () => {
        expect(isTransientModelError({ name: 'ThrottlingException', $metadata: { httpStatusCode: 429 } })).toBe(true);
        expect(isTransientModelError({ name: 'InternalServerException', $metadata: { httpStatusCode: 500 } })).toBe(true);
    });

    it('redacts provider errors into stable product-safe shape', () => {
        expect(
            toModelProviderError(
                Object.assign(new Error('provider included sensitive detail'), {
                    name: 'AccessDeniedException',
                    $metadata: { httpStatusCode: 403 },
                }),
                { provider: 'bedrock', model: 'model-1' },
            ),
        ).toEqual({
            code: 'access_denied',
            provider: 'bedrock',
            model: 'model-1',
            message: 'Model provider access denied.',
            retryable: false,
            statusCode: 403,
            errorClass: 'AccessDeniedException',
        });
    });
});
