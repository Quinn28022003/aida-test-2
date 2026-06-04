import type { ProductAnalytics } from "./analytics.types";

export type BrowserAnalyticsEnv = {
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
};

export type BrowserAnalyticsClient = {
  capture(event: string, properties?: Record<string, unknown>): void;
};

export type CreateBrowserAnalyticsOptions = {
  env?: BrowserAnalyticsEnv;
  client?: BrowserAnalyticsClient;
  getClient?: () => BrowserAnalyticsClient | undefined;
};

export type BrowserObservability = {
  analytics: ProductAnalytics;
};
