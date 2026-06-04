export type ProductAnalyticsEvent = {
  event: string;
  distinctId?: string;
  orgId?: string;
  properties?: Record<string, unknown>;
};

export type ProductAnalyticsSink = {
  capture(event: ProductAnalyticsEvent): void | Promise<void>;
};

export type ProductAnalytics = {
  capture(event: ProductAnalyticsEvent): Promise<void>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
};
