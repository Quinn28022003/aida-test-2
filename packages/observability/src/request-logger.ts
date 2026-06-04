import type { MiddlewareHandler } from "hono";
import * as colours from "yoctocolors-cjs";

import type { PrettyRequestLoggerOptions } from "./request-logger.types";

type MethodColour = (value: string) => string;

type Colours = {
  blue: MethodColour;
  cyan: MethodColour;
  gray: MethodColour;
  green: MethodColour;
  magenta: MethodColour;
  red: MethodColour;
  yellow: MethodColour;
};

function methodColours(colours: Colours): Record<string, MethodColour> {
  return {
    DELETE: colours.red,
    GET: colours.green,
    PATCH: colours.magenta,
    POST: colours.blue,
    PUT: colours.yellow
  };
}

function colourLevel(colours: Colours, level: string) {
  if (level === "ERROR") {
    return colours.red(`[${level}]`);
  }

  if (level === "WARN") {
    return colours.yellow(`[${level}]`);
  }

  return colours.green(`[${level}]`);
}

function colourIcon(colours: Colours, level: string) {
  if (level === "ERROR") {
    return colours.red("x");
  }

  if (level === "WARN") {
    return colours.yellow("!");
  }

  return colours.green("i");
}

function colourMethod(colours: Colours, method: string, label: string) {
  return (methodColours(colours)[method] ?? colours.magenta)(label);
}

function colourStatus(colours: Colours, status: number) {
  if (status >= 500) {
    return colours.red(String(status));
  }

  if (status >= 400) {
    return colours.yellow(String(status));
  }

  if (status >= 300) {
    return colours.cyan(String(status));
  }

  return colours.green(String(status));
}

function colourDuration(colours: Colours, durationMs: number) {
  const label = `${durationMs.toFixed(2)}ms`;

  if (durationMs > 1000) {
    return colours.red(label);
  }

  if (durationMs > 300) {
    return colours.yellow(label);
  }

  return colours.gray(label);
}

export function createPrettyRequestLogger(options?: PrettyRequestLoggerOptions): MiddlewareHandler {
  return async (c, next) => {
    const startedAt = performance.now();
    let error: unknown;

    try {
      await next();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const durationMs = performance.now() - startedAt;
      const status = error ? 500 : c.res.status;
      const timestamp = new Date().toISOString();
      const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
      const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "local";
      const userAgent = c.req.header("user-agent") ?? "-";
      const contentLength = c.res.headers.get("content-length") ?? "-";
      const method = c.req.method.padEnd(6);

      // Log shape: [LEVEL] icon timestamp method path status duration request metadata.
      const requestId = options?.getRequestId?.(c);

      const parts = [
        colourLevel(colours, level),
        colourIcon(colours, level),
        colours.gray(timestamp),
        colourMethod(colours, c.req.method, method),
        c.req.path,
        colourStatus(colours, status),
        colourDuration(colours, durationMs),
        colours.gray(`ip=${ip} bytes=${contentLength} ua="${userAgent}"`)
      ];

      if (requestId) {
        parts.push(colours.gray(`requestId=${requestId}`));
      }

      console.log(parts.join(" "));
    }
  };
}
