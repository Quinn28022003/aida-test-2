# AIDA Contributor Rules

- Use Caveman Mode. Prefer simple, explicit code that is easy to read and debug. Avoid new abstractions unless they remove real duplication or match an existing pattern in the repo.

- Ask when unsure. If a product rule, architecture decision, data contract, or user flow is unclear, stop and ask instead of guessing. Do not invent behaviour that is not in the ticket, docs, or existing implementation.

- Scan before build. Read the relevant code, configs, tests, and docs before changing anything. Look for similar implementations before adding a new function, component, schema, helper, endpoint, or pattern.

- Reuse existing utilities. Do not create duplicate helpers for behaviour that already exists, such as URL normalisation, date formatting, validation, API clients, logging, or error handling.

- Follow established patterns. Match the repo's naming, file structure, component style, API shape, test style, and error-handling approach. Prefer local conventions over introducing a new way to do the same thing.

- Keep exported types in dedicated `.types.ts` files when a package has a meaningful public type surface. Follow the `packages/agents` pattern: implementation files import local types from the sibling `.types.ts` file, and `src/index.ts` re-exports public types from that type file.

- Keep changes scoped. Touch only the files needed for the ticket. Avoid unrelated refactors, formatting churn, dependency changes, or cleanup work unless they are required to complete the task safely.

- Use Australian English for user-facing interface copy. This includes labels, buttons, validation messages, empty states, headings, notifications, and help text.

- Avoid unnecessary `useEffect`. Prefer server data loaders, framework primitives, event handlers, derived state, memoised values, or existing data-fetching patterns where they fit the problem.

- Validate at boundaries. Validate inputs, API payloads, route params, form data, storage reads, and external service responses. Keep backend validation authoritative and do not rely on frontend checks for security or data integrity.

- Protect secrets. Never expose backend secrets, service tokens, private environment variables, credentials, or sensitive error details to frontend code, logs, responses, screenshots, or client-visible messages.

- Keep documentation accurate. Update architecture docs, ADRs, or related README sections only when the change affects system behaviour, contracts, setup, or architectural decisions.
