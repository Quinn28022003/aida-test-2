import type { ConverseCommandOutput, ConverseStreamCommandOutput, ConverseStreamOutput } from '@aws-sdk/client-bedrock-runtime';
import type { ModelProfile, ModelRequest, ModelStreamEvent } from '@aida/contracts';
import { describe, expect, it, vi } from 'vitest';
import { createBedrockModelProvider, invokeModel, streamModel } from './bedrock';
import type { ModelTraceSink } from './bedrock.types';

const profile: ModelProfile = {
    provider: 'bedrock',
    model: 'anthropic.claude-test',
    region: 'ap-southeast-2',
    mode: 'fast',
    supportsFiles: false,
    supportsToolUse: false,
    maxInputTokens: 16_000,
    maxOutputTokens: 800,
    temperature: 0,
};

const request: ModelRequest = {
    profile,
    traceId: 'trace-1',
    messages: [
        { role: 'system', content: 'System prompt must not be traced.' },
        { role: 'user', content: 'User prompt must not be traced.' },
    ],
};

function createClient(output: ConverseCommandOutput | ConverseStreamCommandOutput) {
    return {
        send: vi.fn().mockResolvedValue(output),
    };
}

function commandOutput(output: Partial<ConverseCommandOutput>): ConverseCommandOutput {
    return {
        $metadata: {},
        output: {
            message: {
                role: 'assistant',
                content: [],
            },
        },
        metrics: { latencyMs: 0 },
        stopReason: 'end_turn',
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        ...output,
    };
}

function streamOutput(chunks: ConverseStreamOutput[]): ConverseStreamCommandOutput {
    return {
        $metadata: {},
        stream: (async function* () {
            yield* chunks;
        })(),
    };
}

async function collect(stream: AsyncGenerator<ModelStreamEvent>): Promise<ModelStreamEvent[]> {
    const events: ModelStreamEvent[] = [];

    for await (const event of stream) {
        events.push(event);
    }

    return events;
}

describe('Bedrock model provider', () => {
    it('streams token deltas and final metadata', async () => {
        const client = createClient(
            streamOutput([
                { contentBlockDelta: { delta: { text: 'Hello' }, contentBlockIndex: 0 } },
                { contentBlockDelta: { delta: { text: ' world' }, contentBlockIndex: 0 } },
                { messageStop: { stopReason: 'end_turn' } },
                { metadata: { usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 }, metrics: { latencyMs: 0 } } },
            ]),
        );
        const events = await collect(streamModel(request, { client, now: () => 100 }));

        expect(events).toMatchObject([
            { type: 'start' },
            { type: 'delta', delta: 'Hello' },
            { type: 'delta', delta: ' world' },
            { type: 'metadata', metadata: { provider: 'bedrock', model: profile.model, usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 } } },
            { type: 'done', metadata: { finishReason: 'stop' } },
        ]);
    });

    it('invokes model and returns text with metadata', async () => {
        const client = createClient(commandOutput({
            output: {
                message: {
                    role: 'assistant',
                    content: [{ text: 'Answer' }],
                },
            },
            stopReason: 'max_tokens',
            usage: { inputTokens: 4, outputTokens: 1, totalTokens: 5 },
        }));

        const result = await invokeModel(request, { client, now: () => 25 });

        expect(result).toEqual({
            text: 'Answer',
            metadata: {
                provider: 'bedrock',
                model: profile.model,
                region: profile.region,
                latencyMs: 0,
                usage: { inputTokens: 4, outputTokens: 1, totalTokens: 5 },
                finishReason: 'length',
                retryCount: 0,
                modelHealthState: 'healthy',
                traceId: 'trace-1',
            },
        });
    });

    it('retries transient provider errors', async () => {
        const transientError = Object.assign(new Error('rate limited'), {
            name: 'ThrottlingException',
            $metadata: { httpStatusCode: 429 },
        });
        const client = {
            send: vi
                .fn()
                .mockRejectedValueOnce(transientError)
                .mockResolvedValueOnce(commandOutput({
                    output: {
                        message: {
                            role: 'assistant',
                            content: [{ text: 'Recovered' }],
                        },
                    },
                    stopReason: 'end_turn',
                })),
        };

        const result = await createBedrockModelProvider({
            client,
            sleep: async () => undefined,
            retryPolicy: { maxAttempts: 2 },
            now: () => 0,
        }).invoke(request);

        expect(client.send).toHaveBeenCalledTimes(2);
        expect(result.text).toBe('Recovered');
        expect(result.metadata.retryCount).toBe(1);
    });

    it('passes abort signal to Bedrock client', async () => {
        const abortController = new AbortController();
        const client = createClient(commandOutput({}));

        await invokeModel({ ...request, abortSignal: abortController.signal }, { client, now: () => 0 });

        expect(client.send).toHaveBeenCalledWith(expect.anything(), {
            abortSignal: abortController.signal,
        });
    });

    it('does not retry validation errors', async () => {
        const validationError = Object.assign(new Error('bad input'), {
            name: 'ValidationException',
            $metadata: { httpStatusCode: 400 },
        });
        const client = {
            send: vi.fn().mockRejectedValue(validationError),
        };

        await expect(
            createBedrockModelProvider({
                client,
                sleep: async () => undefined,
                now: () => 0,
            }).invoke(request),
        ).rejects.toMatchObject({
            code: 'validation_error',
            retryable: false,
        });
        expect(client.send).toHaveBeenCalledTimes(1);
    });

    it('blocks calls when model health gate is blocked', async () => {
        const client = {
            send: vi.fn(),
        };
        const recordFailure = vi.fn().mockResolvedValue(undefined);
        const events = await collect(
            streamModel(request, {
                client,
                modelHealthGate: {
                    getState: async () => 'blocked',
                    recordFailure,
                },
                now: () => 0,
            }),
        );

        expect(client.send).not.toHaveBeenCalled();
        expect(recordFailure).not.toHaveBeenCalled();
        expect(events).toMatchObject([
            {
                type: 'error',
                error: {
                    code: 'model_health_blocked',
                    retryable: false,
                },
            },
        ]);
    });

    it('returns provider error without recording failure when invoke is health blocked', async () => {
        const client = {
            send: vi.fn(),
        };
        const recordFailure = vi.fn().mockResolvedValue(undefined);

        await expect(
            invokeModel(request, {
                client,
                modelHealthGate: {
                    canCall: async () => false,
                    recordFailure,
                },
                now: () => 0,
            }),
        ).rejects.toMatchObject({
            code: 'model_health_blocked',
            retryable: false,
        });

        expect(client.send).not.toHaveBeenCalled();
        expect(recordFailure).not.toHaveBeenCalled();
    });

    it('records metadata-only traces', async () => {
        const records: Parameters<ModelTraceSink['record']>[0][] = [];
        const traceSink: ModelTraceSink = {
            record: (entry) => {
                records.push(entry);
            },
        };
        const client = createClient(commandOutput({
            output: {
                message: {
                    role: 'assistant',
                    content: [{ text: 'Secret output' }],
                },
            },
        }));

        await invokeModel(request, { client, traceSink, now: () => 0 });

        expect(records).toHaveLength(2);
        expect(JSON.stringify(records)).not.toContain('System prompt must not be traced.');
        expect(JSON.stringify(records)).not.toContain('User prompt must not be traced.');
        expect(JSON.stringify(records)).not.toContain('Secret output');
        expect(records[1]).toMatchObject({
            event: 'success',
            metadata: {
                provider: 'bedrock',
                model: profile.model,
            },
        });
    });
});
