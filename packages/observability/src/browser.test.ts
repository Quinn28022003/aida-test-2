import { describe, expect, it, vi } from "vitest";
import { createBrowserAnalytics, createBrowserObservability } from "./browser";

describe("browser observability", () => {
  it("captures coarse analytics through a browser client", async () => {
    const client = {
      capture: vi.fn()
    };

    await createBrowserAnalytics({
      env: { NEXT_PUBLIC_POSTHOG_KEY: "ph_key" },
      client
    }).capture({
      event: "message_sent",
      distinctId: "profile_123",
      orgId: "org_123",
      properties: {
        messageBody: "customer text",
        status: "sent"
      }
    });

    expect(client.capture).toHaveBeenCalledWith("message_sent", {
      distinctId: "profile_123",
      orgId: "org_123",
      messageBody: "[REDACTED]",
      status: "sent"
    });
  });

  it("returns no-op analytics without a public key", async () => {
    const client = {
      capture: vi.fn()
    };

    await createBrowserObservability({ client }).analytics.capture({ event: "noop" });

    expect(client.capture).not.toHaveBeenCalled();
  });
});
