import { createHash } from "node:crypto";
import type { RedactionOptions, SummarizedString } from "./redaction.types";

const REDACTED = "[REDACTED]";
const DEFAULT_MAX_STRING_LENGTH = 160;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|password|secret|oauth|(^|[_-])(access[_-]?token|refresh[_-]?token|id[_-]?token|token)$|service[_-]?role|supabase[_-]?service[_-]?role[_-]?key|aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key|resend[_-]?api[_-]?key|signed[_-]?url|signedUrl|prompt|message[_-]?body|document[_-]?excerpt|tool[_-]?output)/i;

/**
 * Returns a stable short fingerprint for oversized string values without exposing
 * the original content.
 */
function hashPreview(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

/**
 * Keeps small strings readable and replaces large strings with size + fingerprint
 * metadata so logs remain useful without storing full content.
 */
function summarizeString(value: string): string | SummarizedString {
  if (value.length <= DEFAULT_MAX_STRING_LENGTH) {
    return value;
  }

  return {
    type: "string",
    length: value.length,
    previewHash: hashPreview(value)
  };
}

/**
 * Narrows generic objects so recursive redaction does not walk arrays, null, or
 * primitive values as records.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively redacts sensitive object keys and collapses arrays/large strings
 * into metadata-only summaries. Tracks visited objects to avoid circular loops.
 */
function redactValue(value: unknown, options: Required<RedactionOptions>, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    if (value.length <= options.maxStringLength) {
      return value;
    }

    return {
      type: "string",
      length: value.length,
      previewHash: hashPreview(value)
    };
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length
    };
  }

  if (!isPlainObject(value)) {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  const redacted: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      redacted[key] = REDACTED;
      continue;
    }

    redacted[key] = redactValue(child, options, seen);
  }

  seen.delete(value);
  return redacted;
}

/**
 * Redacts secrets and customer-sensitive payload fields from arbitrary values
 * before they are sent to logs, analytics, or durable observability records.
 */
export function redactSensitiveFields<T>(value: T, options: RedactionOptions = {}): T {
  return redactValue(
    value,
    {
      maxStringLength: options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH
    },
    new WeakSet()
  ) as T;
}

/**
 * Produces a compact metadata-only representation of a value for debug traces.
 * It preserves useful ids/status/count/timing fields and strips broad payloads.
 */
export function summarizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return summarizeString(value);
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length
    };
  }

  if (isPlainObject(value)) {
    const summary: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        summary[key] = REDACTED;
      } else if (/(_id|Id|status|state|count|Count|durationMs|latencyMs|provider|model|errorClass)$/.test(key)) {
        summary[key] = child;
      }
    }

    return summary;
  }

  return value;
}

/**
 * Summarises function arguments for opt-in debug traces without logging raw
 * prompts, document text, credentials, or large payloads.
 */
export function summariseArgs(args: readonly unknown[]): unknown[] {
  return args.map((arg) => redactSensitiveFields(summarizeValue(arg)));
}

/**
 * Summarises a function result for opt-in debug traces using the same redaction
 * rules as arguments.
 */
export function summariseResult(result: unknown): unknown {
  return redactSensitiveFields(summarizeValue(result));
}
