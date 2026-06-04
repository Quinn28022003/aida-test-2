drop index if exists audit_events_trace_idx;
drop index if exists support_handoff_notifications_trace_idx;
drop index if exists background_jobs_trace_idx;
drop index if exists retrieval_events_trace_idx;
drop index if exists tool_invocations_trace_idx;
drop index if exists agent_invocations_trace_idx;

alter table audit_events
  drop column if exists trace_id,
  drop column if exists request_id;

alter table support_handoff_notifications
  drop column if exists trace_id,
  drop column if exists request_id;

alter table background_jobs
  drop column if exists trace_id,
  drop column if exists request_id;

alter table retrieval_events
  drop column if exists latency_ms,
  drop column if exists trace_id,
  drop column if exists request_id;

alter table tool_invocations
  drop column if exists error_class,
  drop column if exists retry_count,
  drop column if exists latency_ms,
  drop column if exists trace_id,
  drop column if exists request_id;

alter table agent_invocations
  drop column if exists retrieval_event_id,
  drop column if exists prompt_template_id,
  drop column if exists error_class,
  drop column if exists fallback_state,
  drop column if exists model_health_state,
  drop column if exists retry_count,
  drop column if exists finish_reason,
  drop column if exists trace_id,
  drop column if exists request_id;
