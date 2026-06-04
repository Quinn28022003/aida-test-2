import type { ModelProviderMetadata } from "@aida/contracts";
import type { Logger } from "pino";

export type CreateModelTraceSinkOptions = {
  logger?: Logger;
};

export type ModelTraceSink = {
  record(entry: {
    event: "start" | "success" | "error";
    metadata: Partial<ModelProviderMetadata>;
    errorClass?: string;
  }): void | Promise<void>;
};
