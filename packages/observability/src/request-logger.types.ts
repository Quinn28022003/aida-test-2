import type { Context } from "hono";

export type PrettyRequestLoggerOptions = {
  getRequestId?: (c: Context) => string | undefined;
};
