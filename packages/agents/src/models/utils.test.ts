import type { ConverseCommandOutput, Message } from '@aws-sdk/client-bedrock-runtime';
import type { ModelProfile, ModelRequest } from '@aida/contracts';
import { describe, expect, it } from 'vitest';
import {
    backoffDelay,
    elapsed,
    finishReasonFromBedrock,
    messagesForBedrock,
    metadataFromParts,
    metadataFromResponse,
    modelHealthKeyFor,
    systemForBedrock,
    textFromMessage,
    toConverseInput,
    traceMetadata,
    usageFromBedrock,
} from './utils';

const profile: ModelProfile = {
    provider: 'bedrock',
    model: 'anthropic.claude-test',
    region: 'ap-southeast-2',
    mode: 'balanced',
    supportsFiles: false,
    supportsToolUse: true,
    maxInputTokens: 64_000,
    maxOutputTokens: 2_000,
    temperature: 0.2,
};

const request: ModelRequest = {
    profile,
    traceId: 'trace-1',
    messages: [
        { role: 'system', content: 'First system rule.' },
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Prior answer' },
        { role: 'system', content: 'Second system rule.' },
    ],
};

describe('model utils', () => {
    it('maps messages to Bedrock roles without system messages', () => {
        expect(messagesForBedrock(request.messages)).toEqual([
            { role: 'user', content: [{ text: 'Question' }] },
            { role: 'assistant', content: [{ text: 'Prior answer' }] },
        ]);
    });

    it('combines system messages for Bedrock system input', () => {
        expect(systemForBedrock(request.messages)).toEqual([
            {
                text: 'First system rule.\n\nSecond system rule.',
            },
        ]);
    });

    it('returns undefined Bedrock system input when no system message exists', () => {
        expect(systemForBedrock([{ role: 'user', content: 'Question' }])).toBeUndefined();
    });

    it('maps model requests to Bedrock Converse input', () => {
        expect(toConverseInput({ ...request, maxOutputTokens: 500, temperature: 0 })).toEqual({
            modelId: profile.model,
            messages: [
                { role: 'user', content: [{ text: 'Question' }] },
                { role: 'assistant', content: [{ text: 'Prior answer' }] },
            ],
            system: [{ text: 'First system rule.\n\nSecond system rule.' }],
            inferenceConfig: {
                maxTokens: 500,
                temperature: 0,
            },
        });
    });

    it('extracts assistant text from text content blocks only', () => {
        const message: Message = {
            role: 'assistant',
            content: [{ text: 'Hello' }, { image: { format: 'png', source: { bytes: new Uint8Array() } } }, { text: ' world' }],
        };

        expect(textFromMessage(message)).toBe('Hello world');
        expect(textFromMessage(undefined)).toBe('');
    });

    it.each([
        ['end_turn', 'stop'],
        ['stop_sequence', 'stop'],
        ['max_tokens', 'length'],
        ['tool_use', 'tool_use'],
        ['content_filtered', 'content_filter'],
        ['guardrail_intervened', 'content_filter'],
        ['other', 'unknown'],
        [undefined, undefined],
    ] as const)('maps Bedrock finish reason %s', (bedrockReason, expected) => {
        expect(finishReasonFromBedrock(bedrockReason)).toBe(expected);
    });

    it('normalises Bedrock usage and derives totals when missing', () => {
        expect(usageFromBedrock({ inputTokens: 3, outputTokens: 4 })).toEqual({
            inputTokens: 3,
            outputTokens: 4,
            totalTokens: 7,
        });
        expect(usageFromBedrock({ inputTokens: 3, outputTokens: 4, totalTokens: 99 })).toEqual({
            inputTokens: 3,
            outputTokens: 4,
            totalTokens: 99,
        });
    });

    it('builds provider metadata from parts and responses', () => {
        const output: ConverseCommandOutput = {
            $metadata: {},
            output: {
                message: {
                    role: 'assistant',
                    content: [{ text: 'Answer' }],
                },
            },
            stopReason: 'end_turn',
            usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 },
        };

        expect(metadataFromParts(request, 25, 1, 'healthy', { totalTokens: 3 }, 'stop')).toEqual({
            provider: 'bedrock',
            model: profile.model,
            region: profile.region,
            latencyMs: 25,
            usage: { totalTokens: 3 },
            finishReason: 'stop',
            retryCount: 1,
            modelHealthState: 'healthy',
            traceId: 'trace-1',
        });
        expect(metadataFromResponse(request, 30, 2, 'probing', output)).toMatchObject({
            latencyMs: 30,
            retryCount: 2,
            modelHealthState: 'probing',
            usage: { inputTokens: 2, outputTokens: 1, totalTokens: 3 },
            finishReason: 'stop',
        });
    });

    it('builds trace metadata without prompt or output content', () => {
        expect(traceMetadata(request, 2, 'blocked', 10, () => 18, 'ErrorClass')).toEqual({
            provider: 'bedrock',
            model: profile.model,
            region: profile.region,
            latencyMs: 8,
            retryCount: 2,
            modelHealthState: 'blocked',
            errorClass: 'ErrorClass',
            traceId: 'trace-1',
        });
    });

    it('creates model health keys and bounded timing values', () => {
        expect(modelHealthKeyFor(request)).toBe('bedrock:anthropic.claude-test');
        expect(elapsed(20, () => 10)).toBe(0);
        expect(elapsed(10, () => 25)).toBe(15);
    });

    it('uses capped exponential retry backoff', () => {
        const retryPolicy = {
            maxAttempts: 5,
            baseDelayMs: 100,
            maxDelayMs: 250,
            maxElapsedMs: 1_000,
        };

        expect(backoffDelay(1, retryPolicy)).toBe(100);
        expect(backoffDelay(2, retryPolicy)).toBe(200);
        expect(backoffDelay(3, retryPolicy)).toBe(250);
    });
});
