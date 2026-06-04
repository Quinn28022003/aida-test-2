import { describe, expect, it, vi } from "vitest";
import { traceFunction, traceableFunction } from "./trace";

function createLogger() {
  return {
    child: vi.fn(() => createLogger()),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

describe("trace", () => {
  it("uses explicit argument and result summarisers", async () => {
    const logger = createLogger();

    await expect(
      traceFunction("agent.invoke", () => Promise.resolve({ raw: "value" }), {
        enabled: true,
        logger,
        args: [{ prompt: "secret" }],
        summarizeArgs: () => ({ ids: ["message_123"] }),
        summarizeResult: () => ({ status: "completed" })
      })
    ).resolves.toEqual({ raw: "value" });

    expect(logger.debug).toHaveBeenNthCalledWith(1, {
      event: "trace.start",
      functionName: "agent.invoke",
      requestId: undefined,
      traceId: undefined,
      args: { ids: ["message_123"] }
    });
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        event: "trace.success",
        result: { status: "completed" }
      })
    );
  });

  it("passes call arguments through traceableFunction without raw sensitive fields", async () => {
    const logger = createLogger();
    const traced = traceableFunction("tool.call", async (input: { prompt: string; toolId: string }) => input.toolId, {
      enabled: true,
      logger
    });

    await expect(traced({ prompt: "secret", toolId: "tool_123" })).resolves.toBe("tool_123");

    expect(logger.child).toHaveBeenCalledWith({
      args: [{ prompt: "[REDACTED]", toolId: "tool_123" }]
    });
  });
});
