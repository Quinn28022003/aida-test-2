import type { ConverseCommand, ConverseCommandOutput, ConverseStreamCommand, ConverseStreamCommandOutput } from '@aws-sdk/client-bedrock-runtime';
import type { ModelInvokeResult, ModelProviderMetadata, ModelRequest, ModelStreamEvent } from '@aida/contracts';

export type BedrockSendOptions = {
    abortSignal?: AbortSignal;
};

export type BedrockClient = {
    send(command: ConverseCommand | ConverseStreamCommand, options?: BedrockSendOptions): Promise<ConverseCommandOutput | ConverseStreamCommandOutput>;
};

export type ModelHealthState = 'healthy' | 'blocked' | 'probing';

export type ModelHealthGate = {
    getState?: (key: string) => Promise<ModelHealthState>;
    canCall?: (key: string) => Promise<boolean>;
    recordSuccess?: (key: string) => Promise<void>;
    recordFailure?: (key: string, error: unknown) => Promise<void>;
};

export type RetryPolicy = {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    maxElapsedMs: number;
};

export type ModelTraceSink = {
    record: (entry: {
        event: 'start' | 'success' | 'error';
        metadata: Partial<ModelProviderMetadata>;
        errorClass?: string;
    }) => void | Promise<void>;
};

export type BedrockModelProviderOptions = {
    client?: BedrockClient;
    retryPolicy?: Partial<RetryPolicy>;
    modelHealthGate?: ModelHealthGate;
    traceSink?: ModelTraceSink;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
};

export type BedrockModelProvider = {
    invoke: (request: ModelRequest) => Promise<ModelInvokeResult>;
    stream: (request: ModelRequest) => AsyncGenerator<ModelStreamEvent>;
};

export type BedrockRuntimeOptions = Required<Pick<BedrockModelProviderOptions, 'sleep' | 'now'>> &
    Pick<BedrockModelProviderOptions, 'modelHealthGate' | 'traceSink'> & {
        client: BedrockClient;
        retryPolicy: RetryPolicy;
    };
