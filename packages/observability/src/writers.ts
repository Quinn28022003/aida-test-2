import type { TablesInsert } from "@aida/db";
import { redactSensitiveFields } from "./redaction";
import type {
  AgentInvocationInput,
  AuditEventInput,
  BackgroundJobUpdateInput,
  InsertDbClient,
  RetrievalEventInput,
  SupportHandoffNotificationInput,
  ToolInvocationInput,
  WriterOptions
} from "./writers.types";

type WriterInsertRows = {
  agent_invocations: TablesInsert<"agent_invocations">;
  audit_events: TablesInsert<"audit_events">;
  retrieval_events: TablesInsert<"retrieval_events">;
  support_handoff_notifications: TablesInsert<"support_handoff_notifications">;
  tool_invocations: TablesInsert<"tool_invocations">;
};

type WriterTable = keyof WriterInsertRows;

function withoutUndefined(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

async function insertRow<TableName extends WriterTable>(
  db: InsertDbClient,
  table: TableName,
  row: WriterInsertRows[TableName]
): Promise<void> {
  const result = await db.from(table).insert(redactSensitiveFields(withoutUndefined(row)));

  if (result.error) {
    throw result.error;
  }
}

export function createAuditEventWriter({ db }: WriterOptions) {
  return {
    write(input: AuditEventInput): Promise<void> {
      return insertRow(db, "audit_events", input);
    }
  };
}

export function createAgentInvocationWriter({ db }: WriterOptions) {
  return {
    async write(input: AgentInvocationInput): Promise<void> {
      if (!input.agent_version_id || input.agent_version_id.trim() === "") {
        throw new Error("agent_version_id is required when writing an agent invocation.");
      }

      const { metadata, ...row } = input;

      await insertRow(
        db,
        "agent_invocations",
        {
          ...row,
          model_provider: metadata.provider,
          model_name: metadata.model,
          token_input: metadata.usage?.inputTokens,
          token_output: metadata.usage?.outputTokens,
          latency_ms: metadata.latencyMs,
          trace_id: metadata.traceId,
          finish_reason: metadata.finishReason,
          retry_count: metadata.retryCount,
          model_health_state: metadata.modelHealthState,
          fallback_state: metadata.fallbackModel,
          error_class: metadata.errorClass
        } satisfies WriterInsertRows["agent_invocations"]
      );
    }
  };
}

export function createToolInvocationWriter({ db }: WriterOptions) {
  return {
    write(input: ToolInvocationInput): Promise<void> {
      return insertRow(db, "tool_invocations", input);
    }
  };
}

export function createRetrievalEventWriter({ db }: WriterOptions) {
  return {
    write(input: RetrievalEventInput): Promise<void> {
      return insertRow(db, "retrieval_events", input);
    }
  };
}

export function createBackgroundJobEventWriter({ db }: WriterOptions) {
  return {
    async write(input: BackgroundJobUpdateInput): Promise<void> {
      const query = db.from("background_jobs");

      if (!query.update) {
        throw new Error("Database client does not support updates.");
      }

      const { id, ...row } = input;
      const result = await query.update(redactSensitiveFields(withoutUndefined(row))).eq("id", id);

      if (result.error) {
        throw result.error;
      }
    }
  };
}

export function createSupportHandoffNotificationWriter({ db }: WriterOptions) {
  return {
    write(input: SupportHandoffNotificationInput): Promise<void> {
      return insertRow(db, "support_handoff_notifications", input);
    }
  };
}
