import { redactSensitiveFields } from "./redaction";
import type { ProductAnalytics, ProductAnalyticsSink } from "./analytics.types";

export function createProductAnalytics(sink?: ProductAnalyticsSink): ProductAnalytics {
  return {
    async capture(event) {
      if (!sink) {
        return;
      }

      await sink.capture(
        redactSensitiveFields({
          ...event,
          properties: event.properties ?? {}
        })
      );
    },
    async flush() {
      return;
    },
    async shutdown() {
      return;
    }
  };
}
