import type { Logger } from "pino";

export type HeaderReader = {
  header(name: string): string | undefined;
};

export type RequestContext = {
  requestId: string;
  traceId: string;
};

export type RequestLoggerOptions = {
  logger?: Logger;
  now?: () => number;
  createId?: () => string;
};
