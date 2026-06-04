# ADR 0001: Bedrock Provider Contracts

## Status

Accepted

## Context

AIDA needs Bedrock-backed model calls for router and domain agents. The runtime will later use Mastra for agents, workflows, background task streaming, suspend/resume, and human-in-the-loop flows.

The product source of truth remains AIDA-owned tables, events, permissions, and audit records. Mastra runtime state and logs must not become the durable product record.

## Decision

- Put serialisable model request, result, metadata, error, and stream event contracts in `@aida/contracts`.
- Put Bedrock runtime code in backend-only `@aida/agents`.
- Expose provider-level functions first: `streamModel`, `invokeModel`, `getModelProfile`, `createBedrockModelProvider`, `isTransientModelError`, and `toModelProviderError`.
- Use AWS Bedrock `Converse` and `ConverseStream`.
- Keep exact Bedrock model IDs environment-driven.
- Make stream events compatible with future Mastra mapping for workflow suspension, background task lifecycle, and tool progress.
- Store model trace metadata only. Do not store raw prompts, completions, tool output, or document excerpts in analytics or Mastra logs.

## Consequences

- API Gateway and Background Service can consume `@aida/agents`; browser apps cannot.
- Later Mastra integration can wrap the provider without changing public model contracts.
- Invocation persistence, router decisions, human approvals, and Mastra observability remain later tickets.
- If encrypted prompt/output retention becomes required, it needs a separate schema and retention-policy decision.
