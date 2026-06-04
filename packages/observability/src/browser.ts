import { createProductAnalytics } from "./product-analytics";
import { redactSensitiveFields } from "./redaction";
import type {
  BrowserAnalyticsClient,
  BrowserObservability,
  CreateBrowserAnalyticsOptions
} from "./browser.types";

function getGlobalPostHog(): BrowserAnalyticsClient | undefined {
  const candidate = (globalThis as { posthog?: BrowserAnalyticsClient }).posthog;
  return typeof candidate?.capture === "function" ? candidate : undefined;
}

export function createBrowserAnalytics(options: CreateBrowserAnalyticsOptions = {}) {
  const client = options.client ?? options.getClient?.() ?? getGlobalPostHog();
  const hasKey = Boolean(options.env?.NEXT_PUBLIC_POSTHOG_KEY);

  if (!client || !hasKey) {
    return createProductAnalytics();
  }

  return createProductAnalytics({
    capture(event) {
      const safe = redactSensitiveFields({
        ...event,
        properties: {
          ...event.properties,
          orgId: event.orgId
        }
      });

      client.capture(safe.event, {
        ...safe.properties,
        distinctId: safe.distinctId
      });
    }
  });
}

export function createBrowserObservability(options: CreateBrowserAnalyticsOptions = {}): BrowserObservability {
  return {
    analytics: createBrowserAnalytics(options)
  };
}

export type {
  BrowserAnalyticsClient,
  BrowserAnalyticsEnv,
  BrowserObservability,
  CreateBrowserAnalyticsOptions
} from "./browser.types";
export type { ProductAnalytics, ProductAnalyticsEvent, ProductAnalyticsSink } from "./analytics.types";
