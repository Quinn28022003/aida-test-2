#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Generate deterministic RLS SQL from @aida/contracts authz data.
 *
 * Implementation is split under `scripts/rls/generator/` (see `generator/README.md`).
 * This file is the public entry: `generateRlsSql()`, `DEFAULT_OUTPUT_FILE`, and CLI.
 *
 * CLI: `node scripts/rls/generate-rls-sql.mjs [output-file]` (default `DEFAULT_OUTPUT_FILE`).
 *
 * ---------------------------------------------------------------------------
 * Security model (helpers are created in this order in the emitted SQL)
 * ---------------------------------------------------------------------------
 * 1. Identity: `current_profile_id`, `current_profile`
 * 2. Tenant: `is_active_internal_member`, `is_org_member`, `has_org_permission`
 * 3. Project/job: `is_project_member`, `is_job_member`, internal/customer job helpers
 * 4. Conversation: `is_conversation_member`, `can_edit_conversation`, `can_access_conversation`
 * 5. Documents: `can_access_document`, `can_upload_document`
 * 6. Agents: `has_agent_member_access`, `can_start_conversation_with_agent`, `can_invoke_agent_in_conversation`
 *
 * RAG / multi-tenant chain (baseline):
 * - Direct `SELECT` on `document_chunks` / `document_chunk_sources` must route
 *   through `can_access_document(parent_document_id)` so SQL cannot bypass document scope.
 * - External users only see conversation-scoped docs/chunks when the parent
 *   conversation row matches the document tenant columns and they are a direct
 *   conversation member or a valid job member on the matched job; org Vault and
 *   private docs stay internal/owner gated. Viewer conversation members are
 *   read-only; editor conversation members may send messages and upload/attach
 *   conversation-scoped files.
 * - Org Vault (`scope = 'org'`) requires active internal membership plus policy-side
 *   `has_org_permission` where the contract maps read/write actions.
 * - External uploads are limited to `scope = 'conversation'` with
 *   `org_id`/`project_id`/`job_id`/`conversation_id` aligned to the parent
 *   conversation and `can_edit_conversation` (direct editor member or external
 *   owner of a job-owned thread). Editors may `INSERT` / `DELETE`
 *   `message_attachments` for those documents when parent rows align.
 * - `can_access_document` for `scope = 'conversation'` requires the parent
 *   conversation match plus `can_access_conversation` and direct conversation
 *   membership or job membership on the document job.
 * - `can_upload_document` for `scope = 'conversation'` requires parent-row
 *   alignment and editor access via `can_edit_conversation`.
 * - Service role bypasses RLS for apply/background work; user-facing paths must not
 *   rely on service-role reads for tenant data.
 *
 * Messages and `internal_only`:
 * - There is no `messages.internal_only` column in the current schema. Mixed
 *   conversations (internal + external members) do not support internal-only rows;
 *   all messages in a thread are visible to every conversation member under the
 *   baseline policies. Adding `internal_only` later requires a migration plus new
 *   RLS rules and app logic — it is intentionally not implied by today's SQL.
 *
 * Contract: `TABLE_RLS_POLICY_CONFIG` in `@aida/contracts` drives table coverage
 * and which permission key backs each SQL command.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import * as authzContracts from '../../packages/contracts/dist/authz/index.js';
import { buildSeedStatements } from './generator/authz-seed.mjs';
import { generateCreateFunctions, generateDropFunctions } from './generator/plpgsql-helpers.mjs';
import { migrationHeader, section } from './generator/sql-primitives.mjs';
import { createPolicySqlGenerators } from './generator/table-policies.mjs';

export const DEFAULT_OUTPUT_FILE = 'scripts/rls/generated/aida-rls-sync.sql';
const outputFile = process.argv[2] ?? DEFAULT_OUTPUT_FILE;

export function generateRlsSql() {
  const { generateAllPolicies, generateResetPublicRls, generateRlsSetup } = createPolicySqlGenerators(authzContracts);

  const configuredTables = new Set(
    authzContracts.TABLE_RLS_POLICY_CONFIG.filter((config) => config.classification !== 'deny').map(
      (config) => config.table,
    ),
  );
  const seedStatements = buildSeedStatements(authzContracts);
  const policies = generateAllPolicies();
  const rlsSetup = generateRlsSetup();
  const helperFunctionSql = generateCreateFunctions();
  const policyTables = new Set(
    policies.creates.map((policySql) => policySql.match(/on "([^"]+)"/)?.[1]).filter(Boolean),
  );
  const missingConfiguredTables = [...configuredTables].filter((table) => !policyTables.has(table));

  if (missingConfiguredTables.length > 0) {
    throw new Error(`TABLE_RLS_POLICY_CONFIG tables missing policies: ${missingConfiguredTables.join(', ')}`);
  }

  const header = migrationHeader(
    'RLS enforcement sync',
    'Generated from @aida/contracts for Supabase db push (ephemeral migration).',
  ).replace(/-- Generated: .*\n/, '');

  const dropSection = `-- ======== Reset Public RLS and Drop Helper Functions ========
-- Drops every policy in public, disables RLS, and removes FORCE RLS on all ordinary public tables.
-- Scoped to public only; auth, storage, and other schemas are untouched.

${generateResetPublicRls()}

${section(policies.drops)}

${section(generateDropFunctions())}`;

  const seedSection = `-- ======== Seed Permissions and Roles ========

${section(seedStatements.permissions)}

-- Remove catalogue keys and role links that are no longer in the contract
${section(seedStatements.prune)}

${section(seedStatements.roles)}

${section(seedStatements.rolePermissionPrune)}

${section(seedStatements.rolePermissions)}`;

  const functionsSection = `-- ======== Helper Functions ========

${section(helperFunctionSql)}`;

  const enableRlsSection = `-- ======== Enable Row Level Security ========

${section(rlsSetup.enableRls)}

-- Force RLS for table owner (bypass only via service role)
${section(rlsSetup.forceRlsStatements)}`;

  const policiesSection = `-- ======== RLS Policies ========
-- Policy bodies live in generator/table-policies.mjs by domain (org/RBAC,
-- conversations/messages/attachments, documents and chunks, agents). Chunk tables
-- always join or check parent documents through can_access_document(...).

${section(policies.creates)}`;

  const grantsSection = `-- ======== Grants ========

-- Revoke broad authenticated access first, then grant only the privileges used by generated policies.
${section(rlsSetup.revokes)}

${section(rlsSetup.grants)}`;

  const commentsSection = `-- ======== Comments ========

comment on function current_profile_id() is 'Returns the current authenticated user profile ID, or null if not authenticated.';
comment on function is_active_internal_member(uuid) is 'Checks if current user is an active internal member of the specified org.';
comment on function has_org_permission(uuid, text) is 'Checks if current user has a specific permission in the org via roles or grants.';
comment on function is_org_owner(uuid) is 'Checks if current user is an active internal org member with the owner role.';
comment on function is_conversation_member(uuid) is 'Checks if current user has a conversation_members row as subject_type user for the conversation (no separate membership status column).';
comment on function can_edit_conversation(uuid) is 'Editor access: direct editor conversation member, or external owner of a job-owned thread in a granted job.';
comment on function is_project_member(uuid) is 'Checks active project membership for the current user.';
comment on function is_job_member(uuid) is 'Checks job membership for non-archived jobs.';
comment on function can_access_conversation(uuid) is 'Conversation access via project/job grants, conversation membership, or conversation owner within scope.';
comment on function can_access_document(uuid) is 'Document access: private=internal owner; conversation=parent conversation tenant match plus conversation or job member; org=internal member.';
comment on function can_upload_document(uuid, document_scope, uuid, uuid, uuid, uuid) is 'Document upload: scope, owner, and for conversation scope parent conversation tenant alignment plus can_edit_conversation.';
comment on function can_start_conversation_with_agent(uuid) is 'Whether the current user may start a conversation with an active agent via agent_members.';
comment on function can_invoke_agent_in_conversation(uuid, uuid) is 'Agent invocation when user can access the conversation and the agent is a conversation participant or has agent_members invoker/manager access.';
comment on function current_profile() is 'Returns the current authenticated user profile row, or null if not authenticated.';`;

  const sql = `${header}

${dropSection}

${seedSection}

${functionsSection}

${enableRlsSection}

${policiesSection}

${grantsSection}

${commentsSection}
`;

  return {
    sql,
    summary: {
      permissions: authzContracts.PERMISSIONS.length,
      roles: authzContracts.ROLES.length,
      rolePermissions: authzContracts.ROLES.reduce((count, role) => count + role.permissions.length, 0),
      helperFunctions: helperFunctionSql.length,
      configuredTables: configuredTables.size,
      rlsTables: rlsSetup.enableRls.length,
      policies: policies.creates.length,
    },
  };
}

function main() {
  const { sql, summary } = generateRlsSql();
  const absoluteOutputFile = resolve(outputFile);
  mkdirSync(dirname(absoluteOutputFile), { recursive: true });
  writeFileSync(absoluteOutputFile, sql);

  console.log(`Generated RLS SQL: ${outputFile}`);
  console.log(
    `Summary: helpers=${summary.helperFunctions}, permissions=${summary.permissions}, roles=${summary.roles}, role_permissions=${summary.rolePermissions}, tables=${summary.rlsTables}, policies=${summary.policies}`,
  );
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    console.error(`Error generating RLS SQL: ${error.message}`);
    process.exit(1);
  }
}
