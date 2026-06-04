# ADR 0003: CASL Permission Foundation

## Status

Accepted

## Context

AIDA has an authz catalogue in `@aida/contracts` where permission keys use `subject.action` form, such as `conversation.read`, `message.create`, and `agent.invoke`. RLS and database seed data already use those catalogue keys.

Frontend applications need a lightweight way to show, hide, enable, or disable UI affordances from a normalised permissions payload before request-scoped loaders, server middleware, and relationship checks exist.

CASL models checks as `ability.can(action, subject)`. Passing the full permission key as the action, for example `ability.can('conversation.read', 'conversation')`, would make `conversation.read` the action name and diverge from the parsed catalogue model.

## Decision

- Keep `@aida/contracts` as the source of truth for permission keys and parsing.
- Make `@aida/permissions` a CASL foundation package for frontend affordance checks only.
- Accept a normalised payload shaped as `{ permissions: string[] }`.
- Validate every permission key with `parsePermissionKey` from `@aida/contracts`.
- Build CASL rules from parsed values: `can(parsed.action, parsed.subject)`.
- Expose helpers using CASL action + subject arguments: `can(ability, action, subject)`, `cannot(ability, action, subject)`, and `explainDenial(ability, action, subject)`.
- Keep permission loading, Supabase queries, server middleware, cache integration, and relationship-based authorisation out of this package.

## Consequences

- Frontend checks mirror CASL semantics directly: `can(ability, 'read', 'conversation')`.
- Raw catalogue keys remain the transport/storage format, while parsed action + subject values are the check format.
- Invalid catalogue keys fail while building the ability with `InvalidPermissionKeyError`.
- Missing permissions return denied results without throwing; `explainDenial` can produce a basic `missing_permission` reason.
- UI checks remain non-authoritative. RLS and future server checks continue to enforce data access.
- Future permission context loaders or API endpoints can provide the same `{ permissions }` payload without changing the CASL check API.
