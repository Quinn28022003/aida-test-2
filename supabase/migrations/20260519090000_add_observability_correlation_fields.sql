-- Add MVP observability correlation and model/tool metric fields.
-- Existing migrations are immutable; this migration extends the core schema.

alter table agent_invocations
  add column request_id text,
  add column trace_id text,
  add column finish_reason text,
  add column retry_count integer not null default 0,
  add column model_health_state text,
  add column fallback_state text,
  add column error_class text,
  add column prompt_template_id text,
  add column retrieval_event_id uuid references retrieval_events(id) on delete set null;

alter table tool_invocations
  add column request_id text,
  add column trace_id text,
  add column latency_ms integer,
  add column retry_count integer not null default 0,
  add column error_class text;

alter table retrieval_events
  add column request_id text,
  add column trace_id text,
  add column latency_ms integer;

alter table background_jobs
  add column request_id text,
  add column trace_id text;

alter table support_handoff_notifications
  add column request_id text,
  add column trace_id text;

alter table audit_events
  add column request_id text,
  add column trace_id text;

create index agent_invocations_trace_idx
  on agent_invocations(trace_id)
  where trace_id is not null;

create index tool_invocations_trace_idx
  on tool_invocations(trace_id)
  where trace_id is not null;

create index retrieval_events_trace_idx
  on retrieval_events(trace_id)
  where trace_id is not null;

create index background_jobs_trace_idx
  on background_jobs(trace_id)
  where trace_id is not null;

create index support_handoff_notifications_trace_idx
  on support_handoff_notifications(trace_id)
  where trace_id is not null;

create index audit_events_trace_idx
  on audit_events(trace_id)
  where trace_id is not null;

comment on column agent_invocations.request_id is
  'Inbound or generated request correlation id for operational debugging.';
comment on column agent_invocations.trace_id is
  'Cross-event trace id shared by request logs, model calls, tool calls, retrieval events, jobs, and audit records.';
comment on column agent_invocations.finish_reason is
  'Provider finish reason, stored as text so provider vocabularies can evolve without schema churn.';
comment on column agent_invocations.retry_count is
  'Number of provider retry attempts used by this invocation.';
comment on column agent_invocations.model_health_state is
  'Model health gate state observed for this invocation, such as healthy, probing, or blocked.';
comment on column agent_invocations.fallback_state is
  'Fallback routing/model state for this invocation. Does not store prompt or completion text.';
comment on column agent_invocations.error_class is
  'Stable redacted error class for filtering provider/runtime failures.';
comment on column agent_invocations.prompt_template_id is
  'Prompt template identifier used for the invocation, when applicable.';
comment on column agent_invocations.retrieval_event_id is
  'Retrieval event associated with the invocation, when one retrieval pass was used.';

comment on column tool_invocations.trace_id is
  'Cross-event trace id shared with the parent request or agent invocation.';
comment on column retrieval_events.trace_id is
  'Cross-event trace id for joining retrieval records to request logs and agent/tool lifecycle events.';
comment on column background_jobs.trace_id is
  'Cross-event trace id preserved when work moves to the async worker queue.';
comment on column support_handoff_notifications.trace_id is
  'Cross-event trace id for joining support notification delivery to the originating request or handoff.';
comment on column audit_events.trace_id is
  'Cross-event trace id for security-relevant actions.';
