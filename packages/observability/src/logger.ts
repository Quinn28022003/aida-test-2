import pino, { type Logger } from "pino";
import type { CreateLoggerOptions } from "./logger.types";

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  return pino({
    base: options.base ?? undefined,
    level: options.level ?? "info",
    name: options.name
  });
}

export const logger = createLogger({ name: "aida" });
