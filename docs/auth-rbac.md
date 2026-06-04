# Authentication and RBAC

This document describes the Row Level Security (RLS) model for AIDA, including helper function meanings, user definitions, document visibility, and known limitations.

`@aida/contracts` is the authz source of truth for permission keys, role definitions, and table RLS policy metadata. RLS SQL generation and RBAC seed data are generated from these constants.

**Related:** [Database schema](db-schema.md) · [Operations](operations.md) · [ADR 0006 — CLI flows](adrs/0006-internal-database-cli.md) · [ADR 0010 — Hand-written RPC ephemeral sync](adrs/0010-hand-written-rpc-ephemeral-sync.md)

---

## Overview

AIDA uses Supabase Row Level Security (RLS) to enforce tenant isolation at the database layer. All authenticated queries go through RLS policies that determine which rows a user can access based on their membership and permissions.

### Permission catalogue (`resource.action`)

Permission keys are **granular**: snake_case **resource** and a **per-resource action** string joined by a single dot, for example `org.read`, `message.create`, `vault_document.upload`, or explicit business actions like `org_invitation.revoke` and `vault_document.hard_delete`. Each resource in `PERMISSIONS_OBJECT` declares only the actions shipped for MVP; there is no global CRUD requirement. RLS `SELECT` commonly maps to a `read` action where one exists. Permission keys are not customer-facing labels — UI copy uses clear action names.

`READ_PERMISSION_KEYS` lists every catalogue key whose action is exactly `read` (suffix `.read`), used for viewer-style roles.

`TABLE_RLS_POLICY_CONFIG` maps each SQL command on an RLS-covered table to one of these keys; generated policies use `has_org_permission(org_id, '<key>')` where org-level authorisation is required, together with the existing helpers (`can_access_conversation`, `can_access_document`, `can_upload_document`, and so on).

### Client-side CASL affordance checks

`@aida/permissions` provides the frontend CASL foundation for UI affordances only. It accepts a normalised payload such as `{ permissions: ['conversation.read', 'message.create', 'agent.invoke'] }`, validates each key through `@aida/contracts`, parses it into `{ subject, action }`, and creates CASL rules with `can(action, subject)`.

Frontend checks therefore use parsed action and subject values:

```ts
can(ability, 'read', 'conversation');
can(ability, 'create', 'message');
can(ability, 'invoke', 'agent');
```

Do not pass the raw permission key as the CASL action, for example `can(ability, 'conversation.read', 'conversation')`. That treats `conversation.read` as an action name and does not match the repository's CASL model. Client-side denials are presentation hints only; authoritative access remains in RLS and future server-side authorisation.

Authz contract flow:

1. Define base permission catalogue and enums in `packages/contracts/src/authz/constants/data.ts`; derived role and RLS data (`PERMISSIONS`, `ROLES`, `TABLE_RLS_POLICY_CONFIG`, and related) in `authz/data.ts`; table names in `constants/tables.ts`; shared types in `authz/data.types.ts`; helpers such as `parsePermissionKey` in `authz/utils/data.ts`.
2. Optionally preview SQL with `node scripts/rls/generate-rls-sql.mjs` after `pnpm --filter @aida/contracts build` (writes `scripts/rls/generated/aida-rls-sync.sql`, gitignored). `pnpm rls sync` calls the same generator internally when applying.
3. Apply permission seeds, helper functions, and policies with `pnpm rls sync` (ephemeral `supabase/migrations/*_rls_sync.sql` → `supabase db push` → repair history → delete file; not committed). Each sync **resets** the `public` schema first (drops all public policies, disables RLS, removes `FORCE RLS` on ordinary public tables), then installs generated AIDA RLS from contracts. **Warning:** manual policies on `public` tables are removed by `pnpm rls sync`; durable policy behaviour must live in `@aida/contracts` and the generator (`scripts/rls/generator/`).
4. Run integration checks with `pnpm rls test`.

---

## User Definitions

### Internal Users

Internal users are members of an organization with `organization_members.member_type = 'internal'` and `status = 'active'`. Access is scoped by project, job, and conversation membership helpers—not a blanket read of every row in the org:

- Conversations and messages in projects and jobs they belong to, plus conversations where they are direct members
- Org Vault documents (`scope = 'org'`) when they have the relevant org permission
- Conversation-scoped documents when the parent conversation matches the document tenant columns and they are a direct conversation member or a job member on the matched job
- Private documents they own
- Organization management features where RBAC grants apply

### External Users

External users have **no** active `organization_members` row. They access data through customer job membership and/or explicit `conversation_members` rows:

- Job-owned threads they created (`conversations.created_by = self`) in jobs where they are a customer job member
- Conversations where they are direct members (invited or added)
- Messages and conversation-scoped documents only in those allowed conversations (documents require parent conversation tenant match plus membership or job access)
- `viewer` conversation members can read only
- `editor` conversation members, or external owners of job-owned threads, can send messages and attach/upload conversation-scoped files in allowed conversations
- Cannot access org Vault documents
- Cannot create org-scoped or private documents

---

## Helper Functions

The RLS policies use SECURITY DEFINER helper functions to encapsulate access logic:

### `current_profile_id() → uuid`

Returns the current authenticated user's profile ID by looking up `profiles.auth_user_id = auth.uid()`. Returns `null` if no authenticated user.

### `is_active_internal_member(p_org_id uuid) → boolean`

Checks if the current user is an active internal member of the specified organization. External users (no `organization_members` row) return `false`.

### `has_org_permission(p_org_id uuid, p_permission_key text) → boolean`

Checks if the current user has a specific permission in the org through:

1. Direct role assignment (`member_roles`)
2. Group role assignment (`group_members` → `group_roles`)
3. Direct permission grant (`subject_permission_grants`)
4. Group permission grant (`subject_permission_grants` → `group_members`)

### `is_org_owner(p_org_id uuid) → boolean`

Checks if the current user is an active internal member with the `owner` role in the org. Policies use this for direct `conversation_members` mutations so invited users cannot promote themselves from `viewer` to `editor`.

### `is_conversation_member(p_conversation_id uuid) → boolean`

Checks if the current user has a `conversation_members` row for the conversation with `subject_type = 'user'` and `subject_id = current_profile_id()`. There is no separate membership `status` column on `conversation_members` in the MVP schema; presence of that row is the membership signal. Used for conversation-scoped reads and writes where direct membership is required; conversation-scoped **documents** also allow job members when the document row matches the parent conversation (see `can_access_document`).

### `can_edit_conversation(p_conversation_id uuid) → boolean`

Returns true when the current user has a direct user conversation membership with `access_level = 'editor'`, or when they created the conversation and are a customer job member on its job (external owner of a job-owned thread). Policies use this for external conversation write actions. `viewer` members remain read-only.

### `can_access_document(p_document_id uuid) → boolean`

Baseline document access check implementing the visibility matrix:

| Scope          | Access Rule                           |
| -------------- | ------------------------------------- |
| `private`      | Owner only and active internal member |
| `conversation` | Parent `conversations` row matches document `org_id`, `project_id`, `job_id`, and `conversation_id`; then `can_access_conversation` and direct `is_conversation_member` or active `job_members` on the document job |
| `org`          | Active internal member only           |
| `group`        | Denied (no ACL-backed scope yet)      |
| `agent`        | Denied (no ACL-backed scope yet)      |

### `can_access_conversation(p_conversation_id uuid) → boolean`

Checks conversation access through membership helpers:

- Direct user `conversation_members` (viewers and editors).
- Internal job or project membership on the parent job (all conversations in that job).
- External customer job membership **only** when `conversations.created_by = current_profile_id()` (job-owned threads).
- Conversation creator with internal job or project membership (creator access without a membership row).

### `can_upload_document(p_org_id, p_scope, p_owner_id, p_conversation_id) → boolean`

Validates insert permissions for documents:

| Scope          | Insert Rule                                         |
| -------------- | --------------------------------------------------- |
| `private`      | Authenticated owner and active internal member only |
| `conversation` | Authenticated owner; inserted `org_id`/`project_id`/`job_id`/`conversation_id` match the parent conversation; `can_edit_conversation` (direct editor member, or external owner of a job-owned thread in a granted job) |
| `org`          | Authenticated owner and active internal member only |
| `group`        | Denied (no ACL-backed scope yet)                    |
| `agent`        | Denied (no ACL-backed scope yet)                    |

### `can_invoke_agent_in_conversation(p_agent_id uuid, p_conversation_id uuid) → boolean`

Allows invocation when the user can access the conversation, the agent is active in the same org, and either:

- The agent is already a `conversation_members` participant (`subject_type = 'agent'`), or
- The user has `agent_members` access with `invoker` or `manager`.

Org permission keys are not required for conversation-scoped invocation inserts when this helper passes.

---

## Document Visibility Matrix

| Document Scope | Internal User                    | External User                    | Service Role |
| -------------- | -------------------------------- | -------------------------------- | ------------ |
| `private`      | Owner only                       | **Denied**                       | Bypass RLS   |
| `conversation` | Direct conversation members or internal job/project scope | Joined conversations and job-owned threads (`created_by` = self) | Bypass RLS   |
| `org`          | All org members                  | **Denied**                       | Bypass RLS   |
| `group`        | **Denied (baseline)**            | **Denied**                       | Bypass RLS   |
| `agent`        | **Denied (baseline)**            | **Denied**                       | Bypass RLS   |

---

## RLS Policies by Table

`pnpm rls sync` applies the generated script via Supabase CLI. It first resets all RLS state in `public` (every policy, RLS disabled, `FORCE RLS` cleared on ordinary public tables), then enables RLS and creates policies only on tables listed in `TABLE_RLS_POLICY_CONFIG` in `@aida/contracts`. Tables in `public` that are not in that config end sync with RLS off unless a schema migration sets otherwise. After a fresh `pnpm db migrate up`, run `pnpm rls sync` — schema migrations alone do not install RLS.

### `profiles`

- **SELECT own**: Users can read their own profile
- **SELECT org**: Users can read profiles of users in the same org
- **UPDATE own**: Users can update only their own profile

### `organizations`

- **INSERT own**: Authenticated users can create an org when `created_by` matches their own profile
- **SELECT member**: Active org members can read their orgs
- **UPDATE member**: Active internal members can update orgs
- **DELETE member**: Active internal members with delete permission can delete orgs

### `organization_members`

- **SELECT member**: Active org members can read membership list; the creator can read their own active internal bootstrap membership for an org they created
- **INSERT/UPDATE**: Active internal members can manage members; the creator can insert their own active internal bootstrap membership for an org they created

### `member_roles`

- **SELECT member roles**: Active org members with member-read permission can read direct role assignments
- **INSERT/DELETE member roles**: Active internal members with role-assignment permission can manage direct role assignments
- **INSERT bootstrap owner**: The creator can assign themself the global Owner role for an org they created

### `organization_invitations`

- **SELECT member**: Active org members can read invitations
- **INSERT/UPDATE**: Active internal members can manage invitations

### `conversations`

- **SELECT internal**: Active internal members and internal job members can read conversations in scope
- **SELECT member**: External users read joined conversations and job-owned conversations they created
- **INSERT**: Active internal members with permission, or external customer job members creating a thread in their granted job (`created_by = current_profile_id()`)
- **UPDATE**: Conversation members or internal members can update

### `conversation_members`

- **SELECT internal**: Active internal members can read all org conversation members
- **SELECT member**: External users can read members of their conversations
- **INSERT/UPDATE/DELETE**: Org owners only. This protects `access_level` from direct SQL/API role escalation.

### `messages`

- **SELECT internal**: Active internal members can read all org messages
- **SELECT member**: External users can read only their conversation messages
- **INSERT**: Active internal members with permission, or external `editor` members sending as themselves
- **UPDATE**: Users can update only their own messages

**Note:** Internal-only message visibility is not modelled. All messages in a conversation are visible to all conversation members.

### `message_mentions`

- **SELECT internal**: Active internal members can read all org mentions
- **SELECT member**: External users can read mentions in their conversations
- **INSERT**: Conversation members can create mentions

### `conversation_user_state`

- **SELECT own**: Users can read their own state
- **SELECT member**: Conversation members can read others' state
- **INSERT/UPDATE**: Users can manage only their own state

### `documents`

- **SELECT**: Uses `can_access_document()` helper; **conversation**-scoped rows require a matching parent conversation plus direct conversation membership or job membership (org/project scope alone is not enough); **org** vault uses internal + permission as before
- **INSERT**: Uses `can_upload_document()` helper; external users can upload conversation-scoped files when `can_edit_conversation` passes (direct `editor` member, or owner of a job-owned thread in a granted job)
- **UPDATE**: Owner or active internal members

### `document_chunks`

- **SELECT**: Accessible parent document AND non-deleted chunk
- **INSERT**: Active internal members only

### `message_attachments`

- **SELECT**: Conversation-aligned rows with `can_access_document` on the linked document
- **INSERT/DELETE**: Same structural checks as SELECT; writers are direct `editor` conversation user members **or** active internal members with the message-attachment permission. External editors attach only conversation-scoped documents in that thread (enforced by policy joins).

---

## Unsupported features (future work)

### Internal-Only Messages

The current schema has no `internal_only` column on messages. Mixed conversations (internal + external users) expose all messages to all members. To support internal-only messages, a future migration would need to:

1. Add `messages.internal_only boolean not null default false`
2. Update RLS policies to filter `internal_only = true` for non-internal members
3. Update application logic to set the flag appropriately

### Group/Agent Document Scope

Documents with `scope = 'group'` or `scope = 'agent'` are denied for all authenticated users under the baseline rules. A future ACL implementation will:

1. Enable `document_acl` table usage
2. Update `can_access_document()` to check ACL grants
3. Update `can_upload_document()` for group/agent uploads

### Permission checks in policies

Policies combine **membership and scope helpers** (`is_active_internal_member`, `can_access_conversation`, `can_access_document`, …) with **`has_org_permission`** where org-level authorisation is required. Direct conversation-member reads and conversation-scoped uploads do not require org RBAC because external users do not have organisation roles. Import keys from `@aida/contracts` (`PERMISSIONS_OBJECT`, `READ_PERMISSION_KEYS`, or specific `PERMISSIONS_OBJECT.<Resource>.<action>.key` values) instead of hardcoding strings.

---

## Service Role Bypass

Service role (backend-only) bypasses RLS entirely. See [packages/db/README.md](../packages/db/README.md) for service role discipline guidelines.

---
