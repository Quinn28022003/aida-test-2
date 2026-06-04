import { describe, expect, it, vi } from "vitest";
import { createPostHogAnalytics } from "./analytics";
import { createProductAnalytics } from "./product-analytics";

describe("analytics", () => {
  it("no-ops when no analytics transport is configured", async () => {
    await expect(createProductAnalytics().capture({ event: "noop" })).resolves.toBeUndefined();
    await expect(createPostHogAnalytics({}).capture({ event: "noop" })).resolves.toBeUndefined();
  });

  it("maps safe events to PostHog capture", async () => {
    const client = {
      capture: vi.fn(),
      flush: vi.fn(),
      _shutdown: vi.fn()
    };
    const analytics = createPostHogAnalytics({ client });

    await analytics.capture({
      event: "agent_invoked",
      distinctId: "profile_123",
      orgId: "org_123",
      properties: {
        agentId: "agent_123",
        signedUrl: "https://signed.example",
        status: "completed"
      }
    });
    await analytics.flush();
    await analytics.shutdown();

    expect(client.capture).toHaveBeenCalledWith({
      event: "agent_invoked",
      distinctId: "profile_123",
      orgId: "org_123",
      properties: {
        agentId: "agent_123",
        orgId: "org_123",
        signedUrl: "[REDACTED]",
        status: "completed"
      }
    });
    expect(client.flush).toHaveBeenCalledTimes(1);
    expect(client._shutdown).toHaveBeenCalledTimes(1);
  });
});
