import { describe, expect, it, vi } from "vitest";
import {
  createAgentInvocationWriter,
  createAuditEventWriter,
  createToolInvocationWriter
} from "./writers";
import type { InsertDbClient } from "./writers.types";

function createDb() {
  const insert = vi.fn(() => ({ error: undefined }));
  const db: InsertDbClient = {
    from: vi.fn(() => ({ insert }))
  };

  return { db, insert };
}

describe("writers", () => {
  it("writes audit events with request and trace correlation", async () => {
    const { db, insert } = createDb();

    await createAuditEventWriter({ db }).write({
      org_id: "org_123",
      actor_type: "user",
      actor_id: "profile_123",
      action: "conversation.update",
      resource_type: "conversation",
      resource_id: "conversation_123",
      request_id: "req_123",
      trace_id: "trace_123",
      metadata: {
        status: "resolved",
        serviceRoleKey: "secret"
      }
    });

    expect(db.from).toHaveBeenCalledWith("audit_events");
    expect(insert).toHaveBeenCalledWith({
      org_id: "org_123",
      actor_type: "user",
      actor_id: "profile_123",
      action: "conversation.update",
      resource_type: "conversation",
      resource_id: "conversation_123",
      metadata: {
        status: "resolved",
        serviceRoleKey: "[REDACTED]"
      },
      request_id: "req_123",
      trace_id: "trace_123"
    });
  });

  it("writes agent invocation metrics with trace id", async () => {
    const { db, insert } = createDb();

    await createAgentInvocationWriter({ db }).write({
      org_id: "org_123",
      project_id: "project_123",
      job_id: "job_123",
      conversation_id: "conversation_123",
      trigger_message_id: "message_123",
      agent_id: "agent_123",
      agent_version_id: "agent_version_123",
      metadata: {
        provider: "bedrock",
        model: "model_123",
        region: "ap-southeast-2",
        latencyMs: 200,
        retryCount: 1,
        traceId: "trace_123",
        usage: {
          inputTokens: 10,
          outputTokens: 20
        },
        finishReason: "stop",
        modelHealthState: "healthy",
        errorClass: "none"
      }
    });

    expect(db.from).toHaveBeenCalledWith("agent_invocations");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        model_provider: "bedrock",
        model_name: "model_123",
        token_input: 10,
        token_output: 20,
        latency_ms: 200,
        retry_count: 1,
        trace_id: "trace_123",
        finish_reason: "stop",
        model_health_state: "healthy",
        error_class: "none"
      })
    );
  });

  it("requires the active agent version snapshot for invocations", async () => {
    const { db } = createDb();

    await expect(
      createAgentInvocationWriter({ db }).write({
        org_id: "org_123",
        project_id: "project_123",
        job_id: "job_123",
        conversation_id: "conversation_123",
        trigger_message_id: "message_123",
        agent_id: "agent_123",
        agent_version_id: "",
        metadata: {
          provider: "bedrock",
          model: "model_123",
          region: "ap-southeast-2"
        }
      })
    ).rejects.toThrow("agent_version_id is required");
  });

  it("rejects invocations that omit the active agent version snapshot", async () => {
    const { db } = createDb();

    await expect(
      createAgentInvocationWriter({ db }).write({
        org_id: "org_123",
        project_id: "project_123",
        job_id: "job_123",
        conversation_id: "conversation_123",
        trigger_message_id: "message_123",
        agent_id: "agent_123",
        metadata: {
          provider: "bedrock",
          model: "model_123",
          region: "ap-southeast-2"
        }
      })
    ).rejects.toThrow("agent_version_id is required");
  });

  it("writes tool invocation traces with redacted payloads", async () => {
    const { db, insert } = createDb();

    await createToolInvocationWriter({ db }).write({
      org_id: "org_123",
      tool_id: "tool_123",
      request_id: "req_123",
      trace_id: "trace_123",
      input: {
        documentExcerpt: "customer text"
      },
      output: {
        toolOutput: "customer data"
      }
    });

    expect(db.from).toHaveBeenCalledWith("tool_invocations");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        request_id: "req_123",
        trace_id: "trace_123",
        input: { documentExcerpt: "[REDACTED]" },
        output: { toolOutput: "[REDACTED]" }
      })
    );
  });
});
