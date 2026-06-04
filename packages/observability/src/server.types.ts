import type { MiddlewareHandler } from "hono";
import type { Logger } from "pino";
import type { ProductAnalytics, ProductAnalyticsEvent } from "./analytics.types";
import type { CreateLoggerOptions } from "./logger.types";
import type { CreateModelTraceSinkOptions, ModelTraceSink } from "./model-trace-sink.types";
import type { RequestLoggerOptions } from "./request-context.types";
import type { AsyncOrSync, TraceFunctionOptions } from "./trace.types";
import type {
  AgentInvocationInput,
  AuditEventInput,
  BackgroundJobUpdateInput,
  InsertDbClient,
  RetrievalEventInput,
  SupportHandoffNotificationInput,
  ToolInvocationInput
} from "./writers.types";

export type PostHogCaptureClient = {
  capture(event: ProductAnalyticsEvent): void | Promise<void>;
  flush(): Promise<void>;
  _shutdown(): Promise<void>;
};

export type CreatePostHogAnalyticsOptions = {
  apiKey?: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
  client?: PostHogCaptureClient;
};

export type ServerObservabilityEnv = {
  LOG_LEVEL?: CreateLoggerOptions["level"];
  AIDA_DEBUG_TRACE?: boolean | string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
};

export type ObservabilityWriter<TInput> = {
  write(input: TInput): Promise<void>;
};

export type ServerObservabilityWriters = {
  auditEvents: ObservabilityWriter<AuditEventInput>;
  agentInvocations: ObservabilityWriter<AgentInvocationInput>;
  toolInvocations: ObservabilityWriter<ToolInvocationInput>;
  retrievalEvents: ObservabilityWriter<RetrievalEventInput>;
  backgroundJobs: ObservabilityWriter<BackgroundJobUpdateInput>;
  supportHandoffNotifications: ObservabilityWriter<SupportHandoffNotificationInput>;
};

export type CreateServerObservabilityOptions = {
  service: string;
  env?: ServerObservabilityEnv;
  db?: InsertDbClient;
  logger?: CreateLoggerOptions;
  requestLogger?: Omit<RequestLoggerOptions, "logger">;
  analytics?: CreatePostHogAnalyticsOptions;
  modelTraceSink?: CreateModelTraceSinkOptions;
};

export type ServerObservability = {
  logger: Logger;
  requestLogger: MiddlewareHandler;
  analytics: ProductAnalytics;
  modelTraceSink: ModelTraceSink;
  writers: ServerObservabilityWriters;
  trace<T>(name: string, fn: () => AsyncOrSync<T>, options?: TraceFunctionOptions): Promise<T>;
};
