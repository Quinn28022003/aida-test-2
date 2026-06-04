import type {
    ConverseCommandInput,
    ConverseCommandOutput,
    Message,
    SystemContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import type { ModelFinishReason, ModelMessage, ModelProviderMetadata, ModelRequest, ModelUsage } from '@aida/contracts';
import type { ModelHealthState, RetryPolicy } from './bedrock.types';

/**
 * Bedrock Converse accepts system text separately from user/assistant messages.
 */
export function messagesForBedrock(messages: ModelMessage[]): Message[] {
    return messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: [{ text: message.content }],
        }));
}

export function systemForBedrock(messages: ModelMessage[]): SystemContentBlock[] | undefined {
    const systemText = messages
        .filter((message) => message.role === 'system')
        .map((message) => message.content)
        .join('\n\n');

    return systemText ? [{ text: systemText }] : undefined;
}

/**
 * Converts AIDA model messages into Bedrock Converse request shape.
 */
export function toConverseInput(request: ModelRequest): ConverseCommandInput {
    return {
        modelId: request.profile.model,
        messages: messagesForBedrock(request.messages),
        system: systemForBedrock(request.messages),
        inferenceConfig: {
            maxTokens: request.maxOutputTokens ?? request.profile.maxOutputTokens,
            temperature: request.temperature ?? request.profile.temperature,
        },
    };
}

export function usageFromBedrock(usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }): ModelUsage {
    return {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
    };
}

/**
 * Extracts assistant text from Bedrock response blocks.
 */
export function textFromMessage(message: Message | undefined): string {
    return (
        message?.content
            ?.map((block) => ('text' in block ? (block.text ?? '') : ''))
            .filter(Boolean)
            .join('') ?? ''
    );
}

export function finishReasonFromBedrock(reason: string | undefined): ModelFinishReason | undefined {
    if (!reason) {
        return undefined;
    }

    if (reason === 'end_turn' || reason === 'stop_sequence') {
        return 'stop';
    }

    if (reason === 'max_tokens') {
        return 'length';
    }

    if (reason === 'tool_use') {
        return 'tool_use';
    }

    if (reason === 'content_filtered' || reason === 'guardrail_intervened') {
        return 'content_filter';
    }

    return 'unknown';
}

export function metadataFromParts(
    request: ModelRequest,
    latencyMs: number,
    retryCount: number,
    modelHealthState: ModelHealthState,
    usage?: ModelUsage,
    finishReason?: ModelFinishReason,
): ModelProviderMetadata {
    return {
        provider: 'bedrock',
        model: request.profile.model,
        region: request.profile.region,
        latencyMs,
        usage,
        finishReason,
        retryCount,
        modelHealthState,
        traceId: request.traceId,
    };
}

export function metadataFromResponse(
    request: ModelRequest,
    latencyMs: number,
    retryCount: number,
    modelHealthState: ModelHealthState,
    output: ConverseCommandOutput,
): ModelProviderMetadata {
    return metadataFromParts(
        request,
        latencyMs,
        retryCount,
        modelHealthState,
        output.usage ? usageFromBedrock(output.usage) : undefined,
        finishReasonFromBedrock(output.stopReason),
    );
}

/**
 * Keeps latency metadata monotonic even when a test clock returns the same value.
 */
export function elapsed(startedAt: number, now: () => number): number {
    return Math.max(0, now() - startedAt);
}

export function traceMetadata(
    request: ModelRequest,
    retryCount: number,
    modelHealthState: ModelHealthState,
    startedAt: number,
    now: () => number,
    errorClass?: string,
): Partial<ModelProviderMetadata> {
    return {
        provider: 'bedrock',
        model: request.profile.model,
        region: request.profile.region,
        latencyMs: elapsed(startedAt, now),
        retryCount,
        modelHealthState,
        errorClass,
        traceId: request.traceId,
    };
}

/**
 * Groups model health gate state by provider and model.
 */
export function modelHealthKeyFor(request: ModelRequest): string {
    return `${request.profile.provider}:${request.profile.model}`;
}

/**
 * Uses capped exponential backoff between retry attempts.
 */
export function backoffDelay(attempt: number, retryPolicy: RetryPolicy): number {
    const exponential = retryPolicy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
    return Math.min(exponential, retryPolicy.maxDelayMs);
}
