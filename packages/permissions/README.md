# @aida/permissions

CASL foundation for UI affordance checks from merged permission keys.

## Purpose

Callers merge role, group, and direct grant keys elsewhere, then pass:

```ts
{ permissions: ['conversation.read', 'agent.invoke'] }
```

into `buildAbilityFromPermissions`. This package does **not** load permissions from Supabase, call APIs, cache auth context, or perform relationship checks.

## CASL model

- **Action** — the action parsed from the catalogue key (e.g. `read`, `create`, `invoke`)
- **Subject** — the catalogue subject from `PERMISSIONS_OBJECT` (first segment of the key, e.g. `conversation`, `message`, `agent`)

`parsePermissionKey` in `@aida/contracts` splits `subject.action` and validates against `packages/contracts/src/authz/constants/data.ts` — no separate subject map.

```ts
can(ability, 'read', 'conversation');
can(ability, 'create', 'message');
can(ability, 'invoke', 'agent');
```

## Authoritative checks

For **UI affordances only**. Server authorisation stays with RLS and future server middleware.

## Usage

```ts
import {
  buildAbilityFromPermissions,
  can,
  cannot,
  explainDenial,
} from '@aida/permissions';

const ability = buildAbilityFromPermissions({
  permissions: ['conversation.read', 'message.create', 'agent.invoke'],
});

can(ability, 'read', 'conversation'); // true
can(ability, 'create', 'message'); // true
can(ability, 'upload', 'vault_document'); // false

cannot(ability, 'invoke', 'agent'); // false

explainDenial(ability, 'upload', 'vault_document');
```

### Frontend flow

1. Fetch or receive a normalised permission payload from the auth/API layer.
2. Build one ability for the current session or active organisation.
3. Use `can` / `cannot` to show, hide, enable, or disable UI affordances.
4. Use `explainDenial` for a basic denied state when the UI needs a reason.

```tsx
const ability = buildAbilityFromPermissions({
  permissions: currentUser.permissions,
});

if (can(ability, 'create', 'message')) {
  return <SendMessageButton />;
}

const denial = explainDenial(ability, 'create', 'message');
return <DisabledAction reason={denial?.message} />;
```

### Errors and denial

- Invalid catalogue keys throw `InvalidPermissionKeyError` while building the ability.
- Missing permissions do not throw. `can` returns `false`, `cannot` returns `true`, and `explainDenial` returns `{ code: 'missing_permission', action, subject, message }`.
- `explainDenial` returns `null` when the action is allowed.
- Relationship checks such as conversation membership, document ownership, project scope, or agent ACLs are not evaluated here.

## Public exports

| Export | Description |
| --- | --- |
| `buildAbilityFromPermissions({ permissions })` | Build a CASL ability from merged keys |
| `buildAbility(keys)` | Deprecated alias for a flat key array |
| `can(ability, action, subject)` | CASL action + subject check |
| `cannot(ability, action, subject)` | Inverse of `can` |
| `explainDenial(ability, action, subject)` | `null` if allowed; otherwise a `DenialReason` |
| `parsePermissionInput(key)` | Validate and split a catalogue key |
| `InvalidPermissionKeyError` | Invalid catalogue key |
| `AppAbility`, `Permission`, `PermissionAction`, `PermissionSubject`, `DenialReason` | Types |

## Dependencies

- `@aida/contracts` — `PERMISSIONS_OBJECT`, `parsePermissionKey`
- `@casl/ability` — ability rules
