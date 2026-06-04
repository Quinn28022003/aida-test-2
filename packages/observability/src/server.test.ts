import { describe, expect, it, vi } from "vitest";
import { createServerObservability } from "./server";
import type { InsertDbClient } from "./writers.types";

function createDb() {
  const insert = vi.fn(() => ({ error: undefined }));
  const db: InsertDbClient = {
    from: vi.fn(() => ({ insert }))
  };

  return { db, insert };
}

describe("server observability", () => {
  it("creates request middleware, trace helper, analytics, and writers from one factory", async () => {
    const { db, insert } = createDb();
    const analyticsClient = {
      capture: vi.fn(),
      flush: vi.fn(() => Promise.resolve()),
      _shutdown: vi.fn(() => Promise.resolve())
    };
    const observability = createServerObservability({
      service: "api-gateway",
      env: {
        LOG_LEVEL: "info",
        AIDA_DEBUG_TRACE: "true"
      },
      db,
      analytics: {
        client: analyticsClient
      }
    });

    expect(observability.requestLogger).toEqual(expect.any(Function));
    await expect(observability.trace("unit", () => "ok")).resolves.toBe("ok");
    await observability.analytics.capture({ event: "agent_invoked" });
    await observability.writers.auditEvents.write({
      actor_type: "system",
      action: "system.test",
      resource_type: "test"
    });

    expect(analyticsClient.capture).toHaveBeenCalledWith({
      event: "agent_invoked",
      distinctId: undefined,
      orgId: undefined,
      properties: {
        orgId: undefined
      }
    });
    expect(insert).toHaveBeenCalledWith({
      actor_type: "system",
      action: "system.test",
      resource_type: "test"
    });
  });

  it("fails clearly when durable writer is used without db", async () => {
    const observability = createServerObservability({ service: "api-gateway" });

    await expect(
      observability.writers.auditEvents.write({
        actor_type: "system",
        action: "system.test",
        resource_type: "test"
      })
    ).rejects.toThrow("Observability DB client is required before writing audit_events.");
  });
});
