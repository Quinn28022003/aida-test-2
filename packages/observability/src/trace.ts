import { createLogger } from "./logger";
import { summariseArgs, summariseResult } from "./redaction";
import type { AsyncOrSync, TraceFunctionOptions } from "./trace.types";

export async function traceFunction<T>(
  name: string,
  fn: () => AsyncOrSync<T>,
  options: TraceFunctionOptions = {}
): Promise<T> {
  const enabled = options.enabled ?? process.env.AIDA_DEBUG_TRACE === "true";
  const log = options.logger ?? createLogger({ name: "aida-trace" });
  const now = options.now ?? (() => performance.now());
  const startedAt = now();
  const args = options.summarizeArgs?.(options.args ?? []) ?? summariseArgs(options.args ?? []);

  if (enabled) {
    log.debug({
      event: "trace.start",
      functionName: name,
      requestId: options.requestId,
      traceId: options.traceId,
      args
    });
  }

  try {
    const result = await fn();

    if (enabled) {
      log.debug({
        event: "trace.success",
        functionName: name,
        requestId: options.requestId,
        traceId: options.traceId,
        durationMs: Math.max(0, now() - startedAt),
        result: options.summarizeResult?.(result) ?? summariseResult(result)
      });
    }

    return result;
  } catch (error) {
    if (enabled) {
      log.debug({
        event: "trace.error",
        functionName: name,
        requestId: options.requestId,
        traceId: options.traceId,
        durationMs: Math.max(0, now() - startedAt),
        errorClass: error instanceof Error ? error.name : "UnknownError"
      });
    }

    throw error;
  }
}

export function traceableFunction<TArgs extends readonly unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => AsyncOrSync<TResult>,
  options: TraceFunctionOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args) => {
    const log = options.logger ?? createLogger({ name: "aida-trace" });

    return traceFunction(
      name,
      () => fn(...args),
      {
        ...options,
        args,
        logger: log.child({
          args: options.summarizeArgs?.(args) ?? summariseArgs(args)
        })
      }
    );
  };
}
