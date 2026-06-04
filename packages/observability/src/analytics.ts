import { PostHog } from "posthog-node";
import { createProductAnalytics } from "./product-analytics";
import { redactSensitiveFields } from "./redaction";
import type { ProductAnalytics, ProductAnalyticsEvent } from "./analytics.types";
import type { CreatePostHogAnalyticsOptions } from "./server.types";

function toPostHogEvent(event: ProductAnalyticsEvent): ProductAnalyticsEvent {
  const safe = redactSensitiveFields({
    ...event,
    properties: {
      ...event.properties,
      orgId: event.orgId
    }
  });

  return {
    event: safe.event,
    distinctId: safe.distinctId ?? safe.orgId,
    orgId: safe.orgId,
    properties: safe.properties
  };
}

export function createPostHogAnalytics(options: CreatePostHogAnalyticsOptions): ProductAnalytics {
  const client =
    options.client ??
    (options.apiKey
      ? new PostHog(options.apiKey, {
          host: options.host,
          flushAt: options.flushAt,
          flushInterval: options.flushInterval
        })
      : undefined);

  if (!client) {
    return createProductAnalytics();
  }

  return {
    async capture(event) {
      client.capture(toPostHogEvent(event));
    },
    async flush() {
      await client.flush();
    },
    async shutdown() {
      await client._shutdown();
    }
  };
}
