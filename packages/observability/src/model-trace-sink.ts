import { createLogger } from "./logger";
import type { CreateModelTraceSinkOptions, ModelTraceSink } from "./model-trace-sink.types";
import { redactSensitiveFields } from "./redaction";

export function createModelTraceSink(options: CreateModelTraceSinkOptions = {}): ModelTraceSink {
  const log = options.logger ?? createLogger({ name: "aida-model-trace" });

  return {
    record(entry) {
      log.info(
        redactSensitiveFields({
          event: `model.${entry.event}`,
          ...entry.metadata,
          errorClass: entry.errorClass
        })
      );
    }
  };
}
