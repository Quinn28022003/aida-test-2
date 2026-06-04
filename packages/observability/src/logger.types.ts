import type { LoggerOptions } from "pino";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type CreateLoggerOptions = {
  level?: LogLevel;
  name?: string;
  base?: LoggerOptions["base"];
};
