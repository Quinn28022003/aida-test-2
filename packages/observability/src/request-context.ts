import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { createLogger } from "./logger";
import type { HeaderReader, RequestContext, RequestLoggerOptions } from "./request-context.types";
import { redactSensitiveFields } from "./redaction";

export const REQUEST_ID_HEADER = "x-request-id";
export const TRACE_ID_HEADER = "x-trace-id";

function createRandomId(): string {
  return randomUUID();
}

function firstHeaderValue(value: string | undefined): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

export function getRequestId(headers: HeaderReader, createId = createRandomId): string {
  return firstHeaderValue(headers.header(REQUEST_ID_HEADER)) ?? createId();
}

export function getTraceId(headers: HeaderReader, createId = createRandomId): string {
  return firstHeaderValue(headers.header(TRACE_ID_HEADER)) ?? createId();
}

export function withTraceContext<T extends Record<string, unknown>>(context: RequestContext, fields: T): T & RequestContext {
  return {
    ...fields,
    requestId: context.requestId,
    traceId: context.traceId
  };
}

function requestIp(headers: HeaderReader): string | undefined {
  return firstHeaderValue(headers.header("x-forwarded-for")) ?? headers.header("x-real-ip");
}

export function createRequestLogger(options: RequestLoggerOptions = {}): MiddlewareHandler {
  const log = options.logger ?? createLogger({ name: "aida-http" });
  const now = options.now ?? (() => performance.now());
  const createId = options.createId ?? createRandomId;

  return async (c, next) => {
    const startedAt = now();
    const requestId = getRequestId(c.req, createId);
    const traceId = getTraceId(c.req, createId);
    let error: unknown;

    c.header(REQUEST_ID_HEADER, requestId);
    c.header(TRACE_ID_HEADER, traceId);

    try {
      await next();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const durationMs = Math.max(0, now() - startedAt);
      const status = error ? 500 : c.res.status;
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

      log[level](
        redactSensitiveFields({
          event: "http.request",
          requestId,
          traceId,
          method: c.req.method,
          path: c.req.path,
          status,
          durationMs,
          ip: requestIp(c.req),
          userAgent: c.req.header("user-agent"),
          contentLength: c.res.headers.get("content-length") ?? undefined,
          errorClass: error instanceof Error ? error.name : undefined
        })
      );
    }
  };
}
