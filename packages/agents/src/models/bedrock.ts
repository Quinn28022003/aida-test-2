import {
    BedrockRuntimeClient,
    ConverseCommand,
    ConverseStreamCommand,
    type ConverseCommandOutput,
    type ConverseStreamCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import type { ModelFinishReason, ModelInvokeResult, ModelRequest, ModelStreamEvent, ModelUsage } from '@aida/contracts';
import type { BedrockModelProvider, BedrockModelProviderOptions, BedrockRuntimeOptions, ModelHealthGate, ModelHealthState, RetryPolicy } from './bedrock.types';
import { toModelProviderError, validateModelRequest } from './errors';
import {
    backoffDelay,
    elapsed,
    finishReasonFromBedrock,
    metadataFromParts,
    metadataFromResponse,
    modelHealthKeyFor,
    textFromMessage,
    toConverseInput,
    traceMetadata,
    usageFromBedrock,
} from './utils';

const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 1_000,
    maxElapsedMs: 5_000,
};

class ModelHealthBlockedError extends Error {
    constructor() {
        super('Model calls are temporarily blocked after repeated provider failures.');
        this.name = 'ModelHealthBlockedError';
    }
}

/**
 * Identifies health-gate blocks so they are not counted as fresh provider failures.
 */
function isModelHealthBlockedError(error: unknown): boolean {
    return error instanceof ModelHealthBlockedError;
}

/**
 * Passes cancellation through to AWS SDK only when the caller supplied an abort signal.
 */
function bedrockSendOptions(request: ModelRequest): { abortSignal?: AbortSignal } | undefined {
    return request.abortSignal ? { abortSignal: request.abortSignal } : undefined;
}

/**
 * Reads current model health state. A blocked state means recent provider failures crossed the caller's threshold,
 * so the next Bedrock call is stopped before spending latency or model cost.
 */
async function getModelHealthState(modelHealthGate: ModelHealthGate | undefined, key: string): Promise<ModelHealthState> {
    return (await modelHealthGate?.getState?.(key)) ?? 'healthy';
}

/**
 * Stops the call before Bedrock when the caller's model health gate says this model is unavailable.
 */
async function assertModelHealthAllowsCall(modelHealthGate: ModelHealthGate | undefined, key: string): Promise<void> {
    const state = await getModelHealthState(modelHealthGate, key);
    const canCall = await modelHealthGate?.canCall?.(key);

    if (state === 'blocked' || canCall === false) {
        throw new ModelHealthBlockedError();
    }
}

/**
 * Retries only transient provider failures and reports the number of retry attempts used.
 */
async function withRetry(
    operation: () => Promise<ConverseCommandOutput | ConverseStreamCommandOutput>,
    request: ModelRequest,
    options: BedrockRuntimeOptions,
    onRetryCount: (retryCount: number) => void,
): Promise<ConverseCommandOutput | ConverseStreamCommandOutput> {
    const startedAt = options.now();
    let attempt = 0;
    let lastError: unknown;

    while (attempt < options.retryPolicy.maxAttempts && elapsed(startedAt, options.now) <= options.retryPolicy.maxElapsedMs) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (!toModelProviderError(error, { provider: 'bedrock', model: request.profile.model }).retryable) {
                throw error;
            }

            attempt += 1;
            onRetryCount(attempt);

            if (attempt >= options.retryPolicy.maxAttempts) {
                break;
            }

            const delayMs = backoffDelay(attempt, options.retryPolicy);
            if (elapsed(startedAt, options.now) + delayMs > options.retryPolicy.maxElapsedMs) {
                break;
            }

            await options.sleep(delayMs);
        }
    }

    throw lastError;
}

/**
 * Runs a Bedrock Converse call, records metadata-only traces, and returns final assistant text.
 */
async function invokeBedrock(request: ModelRequest, options: BedrockRuntimeOptions): Promise<ModelInvokeResult> {
    validateModelRequest(request);
    const startedAt = options.now();
    const modelHealthKey = modelHealthKeyFor(request);
    const initialModelHealthState = await getModelHealthState(options.modelHealthGate, modelHealthKey);

    let retryCount = 0;

    try {
        await assertModelHealthAllowsCall(options.modelHealthGate, modelHealthKey);
        await options.traceSink?.record({
            event: 'start',
            metadata: traceMetadata(request, 0, initialModelHealthState, startedAt, options.now),
        });

        const output = (await withRetry(
            () => options.client.send(new ConverseCommand(toConverseInput(request)), bedrockSendOptions(request)),
            request,
            options,
            (attempts) => {
                retryCount = attempts;
            },
        )) as ConverseCommandOutput;
        const latencyMs = elapsed(startedAt, options.now);
        const metadata = metadataFromResponse(request, latencyMs, retryCount, initialModelHealthState, output);
        await options.modelHealthGate?.recordSuccess?.(modelHealthKey);
        await options.traceSink?.record({ event: 'success', metadata });

        return {
            text: textFromMessage(output.output?.message),
            metadata,
        };
    } catch (error) {
        if (!isModelHealthBlockedError(error)) {
            await options.modelHealthGate?.recordFailure?.(modelHealthKey, error);
        }

        const providerError = toModelProviderError(error, { provider: 'bedrock', model: request.profile.model });
        await options.traceSink?.record({
            event: 'error',
            metadata: traceMetadata(request, retryCount, initialModelHealthState, startedAt, options.now, providerError.errorClass),
            errorClass: providerError.errorClass,
        });
        throw providerError;
    }
}

/**
 * Streams Bedrock ConverseStream chunks as product events while keeping provider errors redacted.
 */
async function* streamBedrock(request: ModelRequest, options: BedrockRuntimeOptions): AsyncGenerator<ModelStreamEvent> {
    validateModelRequest(request);
    const startedAt = options.now();
    const modelHealthKey = modelHealthKeyFor(request);
    const initialModelHealthState = await getModelHealthState(options.modelHealthGate, modelHealthKey);
    let retryCount = 0;

    try {
        await assertModelHealthAllowsCall(options.modelHealthGate, modelHealthKey);
        await options.traceSink?.record({
            event: 'start',
            metadata: traceMetadata(request, 0, initialModelHealthState, startedAt, options.now),
        });

        yield {
            type: 'start',
            metadata: {
                provider: 'bedrock',
                model: request.profile.model,
                region: request.profile.region,
                traceId: request.traceId,
            },
        };

        const output = (await withRetry(
            () => options.client.send(new ConverseStreamCommand(toConverseInput(request)), bedrockSendOptions(request)),
            request,
            options,
            (attempts) => {
                retryCount = attempts;
            },
        )) as ConverseStreamCommandOutput;

        let usage: ModelUsage | undefined;
        let finishReason: ModelFinishReason | undefined;

        for await (const chunk of output.stream ?? []) {
            const delta = chunk.contentBlockDelta?.delta?.text;
            if (delta) {
                yield { type: 'delta', delta };
            }

            if (chunk.metadata?.usage) {
                usage = usageFromBedrock(chunk.metadata.usage);
            }

            if (chunk.messageStop?.stopReason) {
                finishReason = finishReasonFromBedrock(chunk.messageStop.stopReason);
            }
        }

        const metadata = metadataFromParts(request, elapsed(startedAt, options.now), retryCount, initialModelHealthState, usage, finishReason);
        await options.modelHealthGate?.recordSuccess?.(modelHealthKey);
        await options.traceSink?.record({ event: 'success', metadata });

        yield { type: 'metadata', metadata };
        yield { type: 'done', metadata };
    } catch (error) {
        if (!isModelHealthBlockedError(error)) {
            await options.modelHealthGate?.recordFailure?.(modelHealthKey, error);
        }

        const providerError = toModelProviderError(error, { provider: 'bedrock', model: request.profile.model });
        const metadata = traceMetadata(request, retryCount, initialModelHealthState, startedAt, options.now, providerError.errorClass);
        await options.traceSink?.record({
            event: 'error',
            metadata,
            errorClass: providerError.errorClass,
        });
        yield {
            type: 'error',
            error: providerError,
            metadata,
        };
    }
}

/**
 * Creates a Bedrock provider with injectable AWS client, retry policy, model health gate, and trace sink.
 */
export function createBedrockModelProvider(options: BedrockModelProviderOptions = {}): BedrockModelProvider {
    const retryPolicy = { ...DEFAULT_RETRY_POLICY, ...options.retryPolicy };
    const sleep = options.sleep ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const now = options.now ?? (() => performance.now());
    const client = options.client ?? new BedrockRuntimeClient({});

    return {
        invoke(request) {
            return invokeBedrock(request, { client, retryPolicy, modelHealthGate: options.modelHealthGate, traceSink: options.traceSink, sleep, now });
        },
        stream(request) {
            return streamBedrock(request, { client, retryPolicy, modelHealthGate: options.modelHealthGate, traceSink: options.traceSink, sleep, now });
        },
    };
}

/**
 * Runs a single non-streaming Bedrock model call and returns final text plus provider metadata.
 */
export function invokeModel(request: ModelRequest, options?: BedrockModelProviderOptions): Promise<ModelInvokeResult> {
    return createBedrockModelProvider(options).invoke(request);
}

/**
 * Runs a streaming Bedrock model call and yields stable product stream events.
 */
export function streamModel(request: ModelRequest, options?: BedrockModelProviderOptions): AsyncGenerator<ModelStreamEvent> {
    return createBedrockModelProvider(options).stream(request);
}
