import type { Logger } from "pino";
import type { RequestContext } from "./request-context.types";

export type TraceFunctionOptions = Partial<RequestContext> & {
  enabled?: boolean;
  logger?: Logger;
  now?: () => number;
  args?: readonly unknown[];
  summarizeArgs?: (args: readonly unknown[]) => unknown;
  summarizeResult?: (result: unknown) => unknown;
};

export type AsyncOrSync<T> = T | Promise<T>;
