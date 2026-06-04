export type ModelProvider = 'bedrock';

export type ModelProfileKind = 'router' | 'domainDefault' | 'summarizer';

export type ModelProfileMode = 'fast' | 'balanced' | 'deep';

export type ModelProfile = {
    provider: ModelProvider;
    model: string;
    region: string;
    mode: ModelProfileMode;
    supportsFiles: boolean;
    supportsToolUse: boolean;
    maxInputTokens: number;
    maxOutputTokens: number;
    temperature: number;
};

export type ModelMessageRole = 'system' | 'user' | 'assistant';

export type ModelMessage = {
    role: ModelMessageRole;
    content: string;
};

export type ModelRequest = {
    profile: ModelProfile;
    messages: ModelMessage[];
    maxOutputTokens?: number;
    temperature?: number;
    traceId?: string;
    abortSignal?: AbortSignal;
    metadata?: {
        orgId?: string;
        conversationId?: string;
        messageId?: string;
        agentId?: string;
        agentVersionId?: string;
        promptTemplateId?: string;
        toolIds?: string[];
        retrievalEventId?: string;
    };
};

export type ModelUsage = {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
};

export type ModelFinishReason = 'stop' | 'length' | 'tool_use' | 'content_filter' | 'error' | 'unknown';

export type ModelProviderMetadata = {
    provider: ModelProvider;
    model: string;
    region: string;
    latencyMs: number;
    usage?: ModelUsage;
    finishReason?: ModelFinishReason;
    retryCount: number;
    modelHealthState?: 'healthy' | 'blocked' | 'probing';
    fallbackModel?: string;
    errorClass?: string;
    traceId?: string;
};

export type ModelProviderError = {
    code:
        | 'validation_error'
        | 'access_denied'
        | 'rate_limited'
        | 'provider_unavailable'
        | 'provider_timeout'
        | 'model_health_blocked'
        | 'unknown';
    provider: ModelProvider;
    model?: string;
    message: string;
    retryable: boolean;
    statusCode?: number;
    errorClass?: string;
};

export type ModelInvokeResult = {
    text: string;
    metadata: ModelProviderMetadata;
};

export type ModelStreamEvent =
    | {
          type: 'start';
          metadata: Pick<ModelProviderMetadata, 'provider' | 'model' | 'region' | 'traceId'>;
      }
    | {
          type: 'delta';
          delta: string;
      }
    | {
          type: 'metadata';
          metadata: ModelProviderMetadata;
      }
    | {
          type: 'done';
          metadata: ModelProviderMetadata;
      }
    | {
          type: 'error';
          error: ModelProviderError;
          metadata?: Partial<ModelProviderMetadata>;
      }
    | {
          type: 'workflow_suspended';
          workflowId: string;
          runId: string;
          stepId?: string;
          reason?: string;
          payload?: unknown;
      }
    | {
          type: 'background_task';
          status: 'running' | 'output' | 'completed' | 'failed' | 'cancelled';
          taskId: string;
          runId?: string;
          agentId?: string;
          toolName?: string;
          payload?: unknown;
      }
    | {
          type: 'tool_progress';
          toolName: string;
          status: 'started' | 'progress' | 'completed' | 'failed';
          payload?: unknown;
      };
