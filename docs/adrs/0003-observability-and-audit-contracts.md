# ADR 0003: Observability and Audit Contracts

## Status

Accepted

## Context

AIDA needs enough operational visibility for MVP auth, RLS, agent, tool, ingestion, and handoff debugging. The platform also needs durable product and security records for user-visible history, support review, and incident analysis.

Full observability platforms, prompt tracing products, custom dashboards, and OpenTelemetry exporters are out of scope for MVP.

## Decision

- Use `@aida/observability` as the observability package, with explicit runtime subpath imports:
  - `@aida/observability/server`
  - `@aida/observability/browser`
  - `@aida/observability/shared`
- Use Pino for structured operational logs written to stdout.
- Treat Vercel Runtime Logs and Log Drains as the deployment path for stdout/stderr logs.
- Store only durable product and security records in Postgres:
  - `audit_events`
  - `agent_invocations`
  - `tool_invocations`
  - `retrieval_events`
  - `background_jobs.status` and `background_jobs.error`
  - `support_handoff_notifications`
- Add first-class `request_id` and `trace_id` fields to durable event tables where cross-event correlation is needed.
- Store model/tool metadata only: stable ids, provider, model, token counts, latency, finish reason, retry count, model health state, fallback state, and redacted error class.
- Keep debug traces opt-in through `AIDA_DEBUG_TRACE` or explicit debug options.
- Do not store raw prompts, raw completions, full message bodies, document excerpts, signed URLs, credentials, or customer tool outputs in logs, analytics, or observability records.

## Consequences

- API Gateway and Background Service can correlate request logs, model calls, tool calls, retrieval records, background jobs, handoff notifications, and audit events by `trace_id`.
- Operational logs stay out of Postgres, reducing storage and privacy risk.
- Postgres remains queryable for product/security events that the application needs to display or audit.
- Future OpenTelemetry, Langfuse, Braintrust, or dashboard integrations can be added behind this metadata-only contract without changing product tables.
