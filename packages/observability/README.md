# @aida/observability

Structured logging, request/trace correlation, redaction, product analytics, and durable audit/event writers.

## Exports

- `@aida/observability/server`: backend API. Includes Pino, Hono middleware, PostHog Node, model trace sink, and Postgres writer helpers.
- `@aida/observability/browser`: frontend API for Chat/Vault analytics. No Node imports.
- `@aida/observability/shared`: browser-safe redaction and product analytics contracts.

The root package has no export. Pick the runtime subpath explicitly.
Do not import `@aida/observability/server` from `apps/chat` or `apps/vault` client code.

## Server Usage

```ts
import { createServerObservability } from "@aida/observability/server";
import { Hono } from "hono";

const app = new Hono();
const observability = createServerObservability({
  service: "api-gateway",
  env,
  db: supabase
});

app.use(observability.requestLogger);

await observability.writers.auditEvents.write({
  orgId: "org_123",
  actorType: "user",
  actorId: "profile_123",
  action: "conversation.update",
  resourceType: "conversation",
  resourceId: "conversation_123",
  requestId: "req_123",
  traceId: "trace_123",
  metadata: {
    status: "resolved"
  }
});
```

For local development, use coloured console request logs:

```ts
import { createPrettyRequestLogger } from "@aida/observability/server";

app.use(createPrettyRequestLogger({ getRequestId: (c) => c.get("requestId") }));
```

`createServerObservability()` creates:

- `logger`
- `requestLogger` (structured Pino logs with request/trace correlation)
- `analytics`
- `modelTraceSink`
- `writers.auditEvents`
- `writers.agentInvocations`
- `writers.toolInvocations`
- `writers.retrievalEvents`
- `writers.backgroundJobs`
- `writers.supportHandoffNotifications`
- `trace(name, fn, options)`

If `db` is omitted, durable writers fail with a clear error when used.

## Debug Tracing

```ts
const result = await observability.trace(
  "agent.invoke",
  () => invokeAgent(input),
  {
    requestId,
    traceId,
    args: [input],
    summarizeArgs: ([value]) => ({
      conversationId: value.conversationId,
      agentId: value.agentId
    }),
    summarizeResult: (value) => ({
      status: value.status,
      latencyMs: value.latencyMs
    })
  }
);
```

Debug traces require `AIDA_DEBUG_TRACE=true` or `enabled: true`. Summaries must stay metadata-only.

## Browser Usage

```ts
import { createBrowserObservability } from "@aida/observability/browser";

const observability = createBrowserObservability({
  env: {
    NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST
  }
});

await observability.analytics.capture({
  event: "message_sent",
  distinctId: profileId,
  orgId,
  properties: {
    status: "sent"
  }
});
```

The browser wrapper uses `globalThis.posthog` or an injected `client`. Without a public PostHog key and client, analytics is a no-op.

## Logging Contract

- Pino writes high-volume operational logs to stdout.
- Postgres stores durable product/security records only.
- Every API request gets `request_id` and `trace_id`.
- Agent, tool, retrieval, background job, handoff notification, and audit records preserve request/trace correlation when available.
- Model and tool traces store metadata only: ids, provider, model, token counts, latency, finish reason, retry count, health/fallback state, and redacted error class.

## Forbidden Data

Never log or persist through observability helpers:

- service role keys
- AWS credentials
- Resend API keys
- OAuth tokens
- raw prompts
- full message bodies
- document excerpts
- signed URLs
- tool outputs with customer data
