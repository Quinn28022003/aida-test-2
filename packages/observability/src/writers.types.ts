import type { ModelProviderMetadata } from "@aida/contracts";
import type { Tables, TablesInsert, TablesUpdate } from "@aida/db";

type AgentInvocationModelColumns =
  | "error_class"
  | "fallback_state"
  | "finish_reason"
  | "latency_ms"
  | "model_health_state"
  | "model_name"
  | "model_provider"
  | "retry_count"
  | "token_input"
  | "token_output"
  | "trace_id";

export type InsertResult = {
  error?: unknown;
};

export type InsertQuery = {
  insert(row: Record<string, unknown>): Promise<InsertResult> | InsertResult;
  update?(row: Record<string, unknown>): {
    eq(column: string, value: string): Promise<InsertResult> | InsertResult;
  };
};

export type InsertDbClient = {
  from(table: string): InsertQuery;
};

export type WriterOptions = {
  db: InsertDbClient;
};

export type AuditEventInput = TablesInsert<"audit_events">;

export type AgentInvocationInput = Omit<TablesInsert<"agent_invocations">, AgentInvocationModelColumns> & {
  metadata: ModelProviderMetadata;
};

export type ToolInvocationInput = TablesInsert<"tool_invocations">;

export type RetrievalEventInput = TablesInsert<"retrieval_events">;

export type BackgroundJobUpdateInput = TablesUpdate<"background_jobs"> & {
  id: Tables<"background_jobs">["id"];
};

export type SupportHandoffNotificationInput = TablesInsert<"support_handoff_notifications">;
