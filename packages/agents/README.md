# @aida/agents

## Purpose

Backend-only agent runtime helpers. The MVP surface contains Bedrock model provider functions used by API Gateway and Background Service.

This package may use AWS SDK clients and backend credentials. Browser apps must not import it.

## Public exports

- `streamModel(request, options)` streams model token deltas and final metadata.
- `invokeModel(request, options)` performs non-streaming model calls.
- `getModelProfile(kind, env)` resolves router, domain default, and summariser profiles.
- `createBedrockModelProvider(options)` creates an injectable Bedrock provider for runtime wiring and tests.
- `isTransientModelError(error)` classifies retryable provider failures.
- `toModelProviderError(error)` redacts provider errors into stable product-safe errors.

## Usage

Simple one-off call:

```ts
import { getModelProfile, streamModel } from '@aida/agents';

const profile = getModelProfile('router');

for await (const event of streamModel({
    profile,
    messages: [
        { role: 'system', content: 'Return a short answer.' },
        { role: 'user', content: 'What can you do?' },
    ],
    traceId: 'request-trace-id',
})) {
    // API Gateway maps these to product SSE events.
    console.log(event);
}
```

Reusable API Gateway wiring:

```ts
import { createBedrockModelProvider, getModelProfile } from '@aida/agents';

const modelProvider = createBedrockModelProvider({
    retryPolicy: {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1_000,
        maxElapsedMs: 5_000,
    },
    modelHealthGate: {
        getState: async (key) => 'healthy',
        canCall: async (key) => true,
        recordSuccess: async (key) => undefined,
        recordFailure: async (key, error) => undefined,
    },
    traceSink: {
        record: async (entry) => {
            // Store metadata only. Never store raw prompts, completions, tool output, or document excerpts.
            console.log(entry);
        },
    },
});

const result = await modelProvider.invoke({
    profile: getModelProfile('domainDefault'),
    messages: [{ role: 'user', content: 'Summarise this task.' }],
    traceId: 'request-trace-id',
});
```

## Provider options

`BedrockModelProviderOptions` is inversion of control. `@aida/agents` owns Bedrock request mapping and stream parsing; the calling app owns runtime policy.

| Option | Owner | Purpose |
| --- | --- | --- |
| `client` | App or test | Custom Bedrock client. Omit in production unless custom AWS wiring is needed. |
| `retryPolicy` | API Gateway | Bounds transient retry attempts and elapsed time. Defaults are provided for MVP. |
| `modelHealthGate` | API Gateway | Optional guard that blocks a provider/model after repeated failures. MVP can omit it; later use Redis-backed state. |
| `traceSink` | API Gateway / observability | Receives metadata-only start, success, and error records. |
| `sleep` / `now` | Tests | Deterministic retry and latency tests. |

For first integration, callers can omit `options` and use `streamModel(request)` or `invokeModel(request)`. API Gateway should switch to `createBedrockModelProvider(...)` once shared retry, model health, and trace policy exist.

## Forbidden imports

- React or frontend app code.
- Browser-only SDKs.
- Product UI packages.

Provider request and stream contracts belong in `@aida/contracts`, not this package.

## Owner

- TODO: Assign owner.
