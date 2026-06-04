import type { ModelProviderError, ModelRequest } from '@aida/contracts';

type ProviderErrorInput = {
    provider?: 'bedrock';
    model?: string;
};

type ErrorWithMetadata = Error & {
    name?: string;
    code?: string;
    $metadata?: {
        httpStatusCode?: number;
    };
    retryable?: boolean;
};

const TRANSIENT_ERROR_NAMES = new Set([
    'ThrottlingException',
    'TooManyRequestsException',
    'RequestTimeout',
    'TimeoutError',
    'ServiceUnavailableException',
    'InternalServerException',
    'ModelNotReadyException',
]);

const ACCESS_ERROR_NAMES = new Set(['AccessDeniedException', 'UnrecognizedClientException', 'InvalidSignatureException']);

const VALIDATION_ERROR_NAMES = new Set(['ValidationException', 'ResourceNotFoundException']);

export function isTransientModelError(error: unknown): boolean {
    const candidate = error as ErrorWithMetadata;
    const statusCode = candidate.$metadata?.httpStatusCode;

    if (candidate.retryable === true) {
        return true;
    }

    if (statusCode === 429 || (statusCode !== undefined && statusCode >= 500)) {
        return true;
    }

    return TRANSIENT_ERROR_NAMES.has(candidate.name ?? '') || TRANSIENT_ERROR_NAMES.has(candidate.code ?? '');
}

export function toModelProviderError(error: unknown, input: ProviderErrorInput = {}): ModelProviderError {
    const candidate = error as ErrorWithMetadata;
    const statusCode = candidate.$metadata?.httpStatusCode;
    const errorClass = candidate.name ?? candidate.code ?? 'UnknownError';
    const retryable = isTransientModelError(error);

    if (errorClass === 'ModelHealthBlockedError') {
        return {
            code: 'model_health_blocked',
            provider: input.provider ?? 'bedrock',
            model: input.model,
            message: 'Model calls are temporarily blocked after repeated provider failures.',
            retryable: false,
            statusCode,
            errorClass,
        };
    }

    if (ACCESS_ERROR_NAMES.has(errorClass)) {
        return {
            code: 'access_denied',
            provider: input.provider ?? 'bedrock',
            model: input.model,
            message: 'Model provider access denied.',
            retryable: false,
            statusCode,
            errorClass,
        };
    }

    if (VALIDATION_ERROR_NAMES.has(errorClass) || statusCode === 400) {
        return {
            code: 'validation_error',
            provider: input.provider ?? 'bedrock',
            model: input.model,
            message: 'Model provider rejected the request.',
            retryable: false,
            statusCode,
            errorClass,
        };
    }

    if (statusCode === 429) {
        return {
            code: 'rate_limited',
            provider: input.provider ?? 'bedrock',
            model: input.model,
            message: 'Model provider rate limit exceeded.',
            retryable,
            statusCode,
            errorClass,
        };
    }

    if (retryable) {
        return {
            code: statusCode === 408 ? 'provider_timeout' : 'provider_unavailable',
            provider: input.provider ?? 'bedrock',
            model: input.model,
            message: 'Model provider is temporarily unavailable.',
            retryable,
            statusCode,
            errorClass,
        };
    }

    return {
        code: 'unknown',
        provider: input.provider ?? 'bedrock',
        model: input.model,
        message: 'Model provider call failed.',
        retryable: false,
        statusCode,
        errorClass,
    };
}

export function validateModelRequest(request: ModelRequest): void {
    if (request.profile.provider !== 'bedrock') {
        throw new Error('Only Bedrock model profiles are supported.');
    }

    if (!request.profile.model.trim()) {
        throw new Error('Model profile must include a model.');
    }

    if (!request.profile.region.trim()) {
        throw new Error('Model profile must include a region.');
    }

    if (request.messages.length === 0) {
        throw new Error('Model request must include at least one message.');
    }
}
