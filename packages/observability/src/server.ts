import { createPostHogAnalytics } from './analytics';
import { createLogger } from './logger';
import { createModelTraceSink } from './model-trace-sink';
import { createRequestLogger } from './request-context';
import { traceFunction } from './trace';
import {
  createAgentInvocationWriter,
  createAuditEventWriter,
  createBackgroundJobEventWriter,
  createRetrievalEventWriter,
  createSupportHandoffNotificationWriter,
  createToolInvocationWriter,
} from './writers';
import type { CreateLoggerOptions } from './logger.types';
import type { CreateServerObservabilityOptions, ServerObservability, ServerObservabilityEnv } from './server.types';
import type { AsyncOrSync, TraceFunctionOptions } from './trace.types';
import type { InsertDbClient } from './writers.types';

function isDebugTraceEnabled(env: ServerObservabilityEnv | undefined): boolean {
  return env?.AIDA_DEBUG_TRACE === true || env?.AIDA_DEBUG_TRACE === 'true';
}

function loggerOptions(
  service: string,
  env: ServerObservabilityEnv | undefined,
  options?: CreateLoggerOptions,
): CreateLoggerOptions {
  return {
    ...options,
    level: options?.level ?? env?.LOG_LEVEL ?? 'info',
    name: options?.name ?? service,
  };
}

function missingDbClient(): InsertDbClient {
  return {
    from(table) {
      throw new Error(`Observability DB client is required before writing ${table}.`);
    },
  };
}

function createWriters(db: InsertDbClient) {
  return {
    auditEvents: createAuditEventWriter({ db }),
    agentInvocations: createAgentInvocationWriter({ db }),
    toolInvocations: createToolInvocationWriter({ db }),
    retrievalEvents: createRetrievalEventWriter({ db }),
    backgroundJobs: createBackgroundJobEventWriter({ db }),
    supportHandoffNotifications: createSupportHandoffNotificationWriter({ db }),
  };
}

export function createServerObservability(options: CreateServerObservabilityOptions): ServerObservability {
  const log = createLogger(loggerOptions(options.service, options.env, options.logger));
  const analytics = createPostHogAnalytics({
    apiKey: options.analytics?.apiKey ?? options.env?.NEXT_PUBLIC_POSTHOG_KEY,
    host: options.analytics?.host ?? options.env?.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: options.analytics?.flushAt,
    flushInterval: options.analytics?.flushInterval,
    client: options.analytics?.client,
  });
  const modelTraceSink = createModelTraceSink({
    ...options.modelTraceSink,
    logger: options.modelTraceSink?.logger ?? log.child({ component: 'model-trace' }),
  });

  return {
    logger: log,
    requestLogger: createRequestLogger({
      ...options.requestLogger,
      logger: log.child({ component: 'http' }),
    }),
    analytics,
    modelTraceSink,
    writers: createWriters(options.db ?? missingDbClient()),
    trace<T>(name: string, fn: () => AsyncOrSync<T>, traceOptions: TraceFunctionOptions = {}) {
      return traceFunction(name, fn, {
        ...traceOptions,
        enabled: traceOptions.enabled ?? isDebugTraceEnabled(options.env),
        logger: traceOptions.logger ?? log.child({ component: 'trace' }),
      });
    },
  };
}

export { createPostHogAnalytics } from './analytics';
export { createProductAnalytics } from './product-analytics';
export type { ProductAnalytics, ProductAnalyticsEvent, ProductAnalyticsSink } from './analytics.types';
export { createLogger, logger } from './logger';
export type { CreateLoggerOptions, LogLevel } from './logger.types';
export { createModelTraceSink } from './model-trace-sink';
export type { CreateModelTraceSinkOptions, ModelTraceSink } from './model-trace-sink.types';
export {
  createRequestLogger,
  getRequestId,
  getTraceId,
  REQUEST_ID_HEADER,
  TRACE_ID_HEADER,
  withTraceContext,
} from './request-context';
export type { HeaderReader, RequestContext, RequestLoggerOptions } from './request-context.types';
export { createPrettyRequestLogger } from './request-logger';
export type { PrettyRequestLoggerOptions } from './request-logger.types';
export { redactSensitiveFields, summariseArgs, summariseResult, summarizeValue } from './redaction';
export type { RedactionOptions, SummarizedString } from './redaction.types';
export { traceableFunction, traceFunction } from './trace';
export type { AsyncOrSync, TraceFunctionOptions } from './trace.types';
export {
  createAgentInvocationWriter,
  createAuditEventWriter,
  createBackgroundJobEventWriter,
  createRetrievalEventWriter,
  createSupportHandoffNotificationWriter,
  createToolInvocationWriter,
} from './writers';
export type {
  CreatePostHogAnalyticsOptions,
  CreateServerObservabilityOptions,
  ObservabilityWriter,
  PostHogCaptureClient,
  ServerObservability,
  ServerObservabilityEnv,
  ServerObservabilityWriters,
} from './server.types';
export type {
  AgentInvocationInput,
  AuditEventInput,
  BackgroundJobUpdateInput,
  InsertDbClient,
  InsertQuery,
  InsertResult,
  RetrievalEventInput,
  SupportHandoffNotificationInput,
  ToolInvocationInput,
  WriterOptions,
} from './writers.types';
