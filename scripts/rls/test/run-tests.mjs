#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * RLS integration tests — `scripts/rls/test/run-tests.mjs`
 *
 * What this exercises
 * --------------------
 * - Policies generated from `@aida/contracts` after `pnpm rls sync` on a real Postgres
 *   (same path as CI `database-dry-run`: ephemeral Postgres, migrations, then `rls sync`).
 * - Connect as **`rls_ci`** (see `supabase/ci/mock_supabase_minimal.sql`): the `postgres`
 *   superuser **always bypasses RLS**, so `RLS_TEST_DATABASE_URL` must point at a non‑superuser
 *   role; then `set local role authenticated` plus `request.jwt.claim.sub` = **profile id**
 *   (matches `profiles.id` / `current_profile_id()`), like user‑scoped PostgREST sessions.
 *
 * What this does **not** prove
 * -----------------------------
 * - Service-role bypass (RLS off): covered by docs + static check `verifyPolicyDocs()`.
 * - Hybrid / vector retrieval RPCs: baseline uses an explicit **tripwire** (`pg_proc` count
 *   for `public.match_documents%` must stay 0 until a migration adds one). That is a guard
 *   rail, not “RPC is secure”. The **first** migration introducing `match_documents*` must
 *   replace the tripwire with real RPC calls that prove chunks cannot leak (see
 *   `MATCH_DOCUMENTS_RPC_TRIPWIRE` below). If the RPC is `SECURITY DEFINER` or runs under
 *   service role, tests must assert the function enforces the same rules as RLS (see
 *   `packages/db/README.md` → Retrieval jobs).
 * - Supabase Realtime / Edge / HTTP layers — only SQL + RLS here.
 *
 * Deny patterns
 * --------------
 * - INSERT / WITH CHECK failures: PostgreSQL raises an error → `expectError` plus optional
 *   `expectErrorContains` (substring) to avoid “pass” on unrelated SQL errors.
 * - UPDATE / DELETE with no visible rows: often **0 rows** and **no error** → use follow-up
 *   `select` to assert state unchanged (see viewer delete/update and conversation_members).
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
/** Inserts/deletes fixtures as superuser (RLS bypass is OK here). */
const RLS_FIXTURE_DATABASE_URL = process.env.RLS_FIXTURE_DATABASE_URL ?? process.env.DATABASE_URL;
/** Runs policy assertions; must not be a superuser or BYPASSRLS role. */
const RLS_HARNESS_DATABASE_URL = process.env.RLS_TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

const DB_README = join(__dirname, '../../../packages/db/README.md');

/**
 * Tripwire: the first PR that adds `public.match_documents*` must delete the baseline
 * `pg_proc` count test and add real retrieval tests here (same file is fine; Caveman Mode).
 *
 * Fixture chunk ids (see `fixtures.sql`): org vault `...9991`, conversation `...9992`,
 * private `...9993`, mismatched-org doc `...9994`, mismatched-job doc `...9996`. Fixtures use a shared content lexeme
 * and identical embeddings so a naive “match everything” RPC returns forbidden rows.
 *
 * SECURITY INVOKER: exercising under `set local role authenticated` + JWT sub is enough.
 * SECURITY DEFINER / service path: assert the function applies the same filters as RLS /
 * `packages/db/README.md` (Retrieval jobs) — RLS alone is not proof.
 */
const MATCH_DOCUMENTS_RPC_TRIPWIRE = {
  checklist: [
    'Internal Alpha (`aaaaaaaa…`): RPC may return org Vault chunk `99999999-9999-9999-9999-999999999991` among allowed rows.',
    'External editor (`cccccccc…`): RPC may return only conversation-scoped chunks for conversations they join (e.g. `...9992` for conv `ccc1`); must not return `...9991` (org vault), `...9993` (private), `...9994` (Beta / mismatched org), `...9996` (mismatched job on accessible conversation).',
    'User Alpha: RPC must not return Beta-org / mismatched-org chunks (`...9994`).',
    'Broad query / top-k: result set must not include any chunk id the user cannot `select` from `document_chunks` under the same session (no cross-tenant leak).',
  ],
};

/**
 * Tripwire: today we assert `messages.internal_only` does not exist. When product adds
 * visibility (column or equivalent), replace with a runtime test: e.g. insert internal-only
 * message in a mixed conversation rejected, or external member cannot read it — follow the
 * official product rule.
 */
const MIXED_CONVERSATION_VISIBILITY_TRIPWIRE = {
  checklist: [
    'If `internal_only` (or equivalent) is added, stop asserting column absence; assert behaviour under mixed internal + external membership.',
  ],
};

/** Ensures service-role discipline copy stays in-repo (acceptance / onboarding). */
function verifyPolicyDocs() {
  if (!existsSync(DB_README)) {
    throw new Error(`Missing ${DB_README}`);
  }
  const text = readFileSync(DB_README, 'utf8');
  const markers = [
    '## Service role bypass discipline',
    'SUPABASE_SERVICE_ROLE_KEY',
    'Never expose service keys',
    'user-scoped reads',
  ];
  for (const m of markers) {
    if (!text.includes(m)) {
      throw new Error(`packages/db/README.md must document service role discipline; missing: ${JSON.stringify(m)}`);
    }
  }
}

function execErrorText(err) {
  const parts = [err.stderr, err.stdout, err.message].filter(Boolean);
  return parts.map((p) => (Buffer.isBuffer(p) ? p.toString('utf8') : String(p))).join('\n');
}

// Test configuration (see file header for fixture roles and runner limits)
const TESTS = [
  // ==========================================================================
  // ALLOWED CASES - Internal User (Org Alpha member)
  // ==========================================================================
  {
    name: 'internal user can read org conversation',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'internal user can read org messages',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'internal user can read org Vault document',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'`,
    expect: '1',
  },
  {
    name: 'internal user can read org document chunks',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from document_chunks where document_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'`,
    expect: '1',
  },
  {
    name: 'internal owner can read private document',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff3'`,
    expect: '1',
  },
  {
    name: 'internal co-worker cannot read another internal user private document (owner-only)',
    user: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff3'`,
    expect: '0',
  },
  {
    name: 'internal project member can read job conversation without direct membership',
    user: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external job-only member can read granted job',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from jobs where id = '11111111-cccc-cccc-cccc-111111111111'`,
    expect: '1',
  },
  {
    name: 'external job-only member cannot read internal-created conversation in granted job',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '0',
  },
  {
    name: 'external job-only member cannot read messages in internal-created conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '0',
  },
  {
    name: 'external job-only member cannot read conversation document in internal-created conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'`,
    expect: '0',
  },
  {
    name: 'external job-only member can read own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc3'`,
    expect: '1',
  },
  {
    name: 'external job-only member can read messages in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc3'`,
    expect: '1',
  },
  {
    name: 'external job-only member can read conversation document in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffffa'`,
    expect: '1',
  },
  {
    name: 'external job-only member can read conversation document chunks in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999995'`,
    expect: '1',
  },
  {
    name: 'external job-only member can read message attachment in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888806'`,
    expect: '1',
  },
  {
    name: 'external job-only member cannot read message attachment in internal-created conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888801'`,
    expect: '0',
  },
  {
    name: 'external job-only member cannot read org Vault document',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'`,
    expect: '0',
  },

  // ==========================================================================
  // ALLOWED CASES - External User (Conversation member, no org membership)
  // ==========================================================================
  {
    name: 'external user can read their conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external viewer can read their conversation',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external user can read messages in their conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external user can read conversation document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'`,
    expect: '1',
  },
  {
    name: 'external user can read conversation document chunks',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where document_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'`,
    expect: '1',
  },
  {
    name: 'external user can read message attachments',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from message_attachments where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external viewer can read message attachments',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `select count(*) from message_attachments where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1'`,
    expect: '1',
  },
  {
    name: 'external user can read only their accessible documents',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents`,
    expect: '1',
  },
  {
    name: 'internal user can read organisation invitation',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from organization_invitations where id = '77777777-7777-7777-7777-777777777701'`,
    expect: '1',
  },
  {
    name: 'external user cannot read organisation invitation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from organization_invitations where id = '77777777-7777-7777-7777-777777777701'`,
    expect: '0',
  },
  {
    name: 'bootstrap: profile can insert organization when created_by is current profile',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organizations (id, name, slug, plan, created_by)
          values ('33333333-3333-3333-3333-333333333331', 'Bootstrap Org One', 'bootstrap-org-one', 'starter', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
          select count(*) from organizations where id = '33333333-3333-3333-3333-333333333331';`,
    expect: '1',
  },
  {
    name: 'bootstrap: profile can insert own active internal membership for self-created org',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organizations (id, name, slug, plan, created_by)
          values ('33333333-3333-3333-3333-333333333332', 'Bootstrap Org Two', 'bootstrap-org-two', 'starter', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
          insert into organization_members (id, org_id, user_id, member_type, status)
          values ('33333333-3333-3333-3333-3333333333a1', '33333333-3333-3333-3333-333333333332', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'internal', 'active');
          select count(*) from organization_members where id = '33333333-3333-3333-3333-3333333333a1';`,
    expect: '1',
  },
  {
    name: 'bootstrap: profile can assign owner role for self-created org',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organizations (id, name, slug, plan, created_by)
          values ('33333333-3333-3333-3333-333333333335', 'Bootstrap Org Five', 'bootstrap-org-five', 'starter', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
          insert into member_roles (org_id, user_id, role_id, assigned_by)
          select '33333333-3333-3333-3333-333333333335', 'cccccccc-cccc-cccc-cccc-cccccccccccc', r.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'
          from roles r
          where r.org_id is null and r.key = 'owner';
          insert into organization_members (id, org_id, user_id, member_type, status)
          values ('33333333-3333-3333-3333-3333333333a5', '33333333-3333-3333-3333-333333333335', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'internal', 'active');
          select has_org_permission('33333333-3333-3333-3333-333333333335', 'project.create');`,
    expect: 't',
  },
  {
    name: 'bootstrap RPC: authenticated user can create org atomically',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select bootstrap_organization('Bootstrap RPC Org', 'bootstrap-rpc-org', 'default', 'en-AU');
          select count(*) from organizations where slug = 'bootstrap-rpc-org';`,
    expect: '1',
  },
  {
    name: 'bootstrap RPC: creates owner role and active internal membership',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select bootstrap_organization('Bootstrap RPC Org Two', 'bootstrap-rpc-org-two', 'default', 'en-AU');
          select case 
            when (
              select count(*) > 0 from member_roles mr
              join organizations o on o.id = mr.org_id
              where o.slug = 'bootstrap-rpc-org-two'
                and mr.user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
                and exists (
                  select 1 from roles r
                  where r.id = mr.role_id
                    and r.org_id is null
                    and r.key = 'owner'
                )
            ) and (
              select count(*) > 0 from organization_members om
              join organizations o on o.id = om.org_id
              where o.slug = 'bootstrap-rpc-org-two'
                and om.user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
                and om.member_type = 'internal'
                and om.status = 'active'
            ) and (
              select has_org_permission(
                (select id from organizations where slug = 'bootstrap-rpc-org-two'),
                'project.create'
              )
            )
            then 't' else 'f' 
          end;`,
    expect: 't',
  },
  {
    name: 'bootstrap RPC: invalid auth fails and leaves no partial organization',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `set local request.jwt.claim.sub = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
          select bootstrap_organization('Bootstrap RPC Denied', 'bootstrap-rpc-denied', 'default', 'en-AU');`,
    expectError: true,
    expectErrorContains: 'Authenticated profile is required for organization bootstrap',
  },
  {
    name: 'bootstrap: profile cannot insert organization for different created_by',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organizations (id, name, slug, plan, created_by)
          values ('33333333-3333-3333-3333-333333333333', 'Bootstrap Org Three', 'bootstrap-org-three', 'starter', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'bootstrap: profile cannot insert membership for another user in self-created org',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organizations (id, name, slug, plan, created_by)
          values ('33333333-3333-3333-3333-333333333334', 'Bootstrap Org Four', 'bootstrap-org-four', 'starter', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
          insert into organization_members (id, org_id, user_id, member_type, status)
          values ('33333333-3333-3333-3333-3333333333a2', '33333333-3333-3333-3333-333333333334', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal', 'active');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'bootstrap: profile cannot insert self membership for org they did not create',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into organization_members (id, org_id, user_id, member_type, status)
          values ('33333333-3333-3333-3333-3333333333a3', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'internal', 'active');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'internal user can read message mention in org conversation',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from message_mentions where id = '66666666-6666-6666-6666-666666666601'`,
    expect: '1',
  },
  {
    name: 'internal user can read conversation user state',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from conversation_user_state where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1' and user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'`,
    expect: '1',
  },

  // ==========================================================================
  // DENIED CASES - External User
  // ==========================================================================
  {
    name: 'external user cannot read org Vault document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'`,
    expect: '0',
  },
  {
    name: 'external user cannot read another org conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'`,
    expect: '0',
  },
  {
    name: 'external user cannot read another org messages',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'`,
    expect: '0',
  },
  {
    name: 'external user cannot read private document owned by another',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff3'`,
    expect: '0',
  },
  {
    name: 'external user cannot read private document chunk (inherits document RLS)',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999993'`,
    expect: '0',
  },
  {
    name: 'external user cannot read mismatched conversation document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff6'`,
    expect: '0',
  },
  {
    name: 'external user cannot read mismatched org message',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3'`,
    expect: '0',
  },
  {
    name: 'external user cannot read mismatched message attachment',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888802'`,
    expect: '0',
  },
  {
    name: 'external user cannot read mismatched job conversation document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffffb'`,
    expect: '0',
  },
  {
    name: 'external user cannot read mismatched job conversation document chunk',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999996'`,
    expect: '0',
  },
  {
    name: 'external conversation member cannot read job-only external conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc3'`,
    expect: '0',
  },
  {
    name: 'external conversation member cannot read messages in job-only external conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc3'`,
    expect: '0',
  },
  {
    name: 'external conversation member cannot read job-only conversation document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffffa'`,
    expect: '0',
  },
  {
    name: 'external conversation member cannot read job-only message attachment',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888806'`,
    expect: '0',
  },

  // ==========================================================================
  // DENIED CASES - Cross-Org Access
  // ==========================================================================
  {
    name: 'internal user cannot read another org conversation',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from conversations where id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'`,
    expect: '0',
  },
  {
    name: 'internal user cannot read another org messages',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from messages where conversation_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2'`,
    expect: '0',
  },
  {
    name: 'internal org Alpha user cannot select Beta message by direct id',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'`,
    expect: '0',
  },
  {
    name: 'external user cannot select Beta message by direct id',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2'`,
    expect: '0',
  },
  {
    name: 'internal user cannot read mismatched job conversation document',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffffb'`,
    expect: '0',
  },
  {
    name: 'internal org member cannot read conversation document without direct membership',
    user: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sql: `select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'`,
    expect: '0',
  },
  {
    name: 'internal org member cannot read conversation chunks without direct membership',
    user: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sql: `select count(*) from document_chunks where document_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2'`,
    expect: '0',
  },

  // ==========================================================================
  // BROAD SCANS — ensure unfiltered SELECT cannot leak other-tenant rows
  // ==========================================================================
  {
    name: 'internal org Alpha user broad messages select sees Alpha job threads only (not Beta)',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from messages`,
    expect: '2',
  },
  {
    name: 'internal user with Alpha and Beta project access sees messages in both projects plus Alpha job threads',
    user: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sql: `select count(*) from messages`,
    expect: '3',
  },
  {
    name: 'external editor broad messages select sees only their org Alpha conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from messages`,
    expect: '1',
  },
  {
    name: 'external editor broad document_chunks select returns only accessible chunks',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks`,
    expect: '1',
  },

  // ==========================================================================
  // TRIPWIRE — mixed conversation visibility (schema baseline)
  // ==========================================================================
  {
    name: 'TRIPWIRE: messages has no internal_only column (replace with runtime tests when product adds visibility)',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*)::text from information_schema.columns
          where table_schema = 'public' and table_name = 'messages' and column_name = 'internal_only'`,
    expect: '0',
    tripwireHint:
      'Column appeared: implement scenarios from MIXED_CONVERSATION_VISIBILITY_TRIPWIRE.checklist in this file: ' +
      MIXED_CONVERSATION_VISIBILITY_TRIPWIRE.checklist.join(' '),
  },

  // ==========================================================================
  // DOCUMENT CHUNK ACCESS VIA PARENT DOCUMENT
  // ==========================================================================
  {
    name: 'cannot read chunks for inaccessible document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where document_id = 'ffffffff-ffff-ffff-ffff-fffffffffff1'`,
    expect: '0',
  },
  {
    name: 'document_chunks RLS: external cannot select org vault chunk by id (table-level, not RPC)',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999991'`,
    expect: '0',
  },
  {
    name: 'document_chunks RLS: external cannot select mismatched-org chunk by id',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999994'`,
    expect: '0',
  },
  {
    name: 'document_chunks RLS: external cannot select mismatched-job chunk by id',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id = '99999999-9999-9999-9999-999999999996'`,
    expect: '0',
  },
  // ==========================================================================
  // RETRIEVAL RPC ACCESS — tripwire (baseline: no match_documents*)
  // ==========================================================================
  {
    name: 'TRIPWIRE: no public.match_documents% until migration adds RPC (then add leak tests; see MATCH_DOCUMENTS_RPC_TRIPWIRE)',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*)::text from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname like 'match\\_documents%' escape '\\'`,
    expect: '0',
    tripwireHint:
      'RPC appeared: remove this count=0 test and add real match_documents* calls under the same JWT harness. Required scenarios: ' +
      MATCH_DOCUMENTS_RPC_TRIPWIRE.checklist.join(' '),
  },
  {
    name: 'external user can upload conversation-scoped document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff4', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'External Conversation Upload', 'text/plain', 123, 'vault', 'conv/external-upload.txt', 'uploaded');
          select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff4';`,
    expect: '1',
  },
  {
    name: 'external viewer cannot upload conversation-scoped document',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff9', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'Viewer Conversation Upload', 'text/plain', 123, 'vault', 'conv/viewer-upload.txt', 'uploaded');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external editor can send message',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
          values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'External editor message');
          select count(*) from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5';`,
    expect: '1',
  },
  {
    name: 'external editor cannot spoof message sender',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
          values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Spoofed message');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external viewer cannot send message',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
          values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Viewer message');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external viewer update message affects no rows; body unchanged (RLS UPDATE silent deny)',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `update messages set body = 'tampered-by-viewer' where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
          select body from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';`,
    expect: 'Message in Org Alpha conversation',
  },
  {
    name: 'external viewer delete message affects no rows (RLS DELETE silent deny)',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `delete from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
          select count(*) from messages where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';`,
    expect: '1',
  },
  {
    name: 'external user cannot upload org-scoped document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into documents (id, org_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff5', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'org', 'External Org Upload', 'text/plain', 123, 'vault', 'org/external-upload.txt', 'uploaded');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external user cannot upload private document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into documents (id, org_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff7', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', null, 'private', 'External Private Upload', 'text/plain', 123, 'vault', 'private/external-upload.txt', 'uploaded');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external user cannot upload conversation document for another org conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into documents (id, org_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff8', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'conversation', 'External Other Conversation Upload', 'text/plain', 123, 'vault', 'conv/external-other-upload.txt', 'uploaded');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external editor cannot upload conversation document with mismatched job for accessible conversation',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffffc', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '22222222-dddd-dddd-dddd-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'Mismatched Job Upload', 'text/plain', 123, 'vault', 'conv/mismatched-job-upload.txt', 'uploaded');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external user can insert message attachment for conversation-scoped document',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
          values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'External editor attachment message');
          insert into message_attachments (id, org_id, conversation_id, message_id, document_id)
          values ('88888888-8888-8888-8888-888888888803', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8', 'ffffffff-ffff-ffff-ffff-fffffffffff2');
          select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888803';`,
    expect: '1',
  },
  {
    name: 'external viewer cannot insert message attachment',
    user: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    sql: `insert into message_attachments (id, org_id, conversation_id, message_id, document_id)
          values ('88888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external user cannot attach org vault document to message',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into message_attachments (id, org_id, conversation_id, message_id, document_id)
          values ('88888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff1');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'user cannot insert mismatched org message',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
          values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Blocked mismatched org message');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external editor cannot update conversation access level',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `update conversation_members
          set access_level = 'viewer'
          where id = 'dddddddd-dddd-dddd-dddd-dddddddddd02';
          select access_level from conversation_members where id = 'dddddddd-dddd-dddd-dddd-dddddddddd02';`,
    expect: 'editor',
  },
  {
    name: 'org owner can update conversation access level',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `update conversation_members
          set access_level = 'editor'
          where id = 'dddddddd-dddd-dddd-dddd-dddddddddd04';
          select access_level from conversation_members where id = 'dddddddd-dddd-dddd-dddd-dddddddddd04';`,
    expect: 'editor',
  },

  // ==========================================================================
  // AGENT INVOCATION — conversation participant without agent_members grant
  // ==========================================================================
  {
    name: 'external editor can insert agent invocation when agent is conversation participant',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `insert into agent_invocations (id, org_id, project_id, job_id, conversation_id, trigger_message_id, agent_id, requested_by, model_name)
          values ('aaaa1111-1111-1111-1111-111111111199', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'aaaa1111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'test-model');
          select count(*) from agent_invocations where id = 'aaaa1111-1111-1111-1111-111111111199';`,
    expect: '1',
  },
  {
    name: 'external job-only member cannot insert agent invocation when agent is not in conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `insert into agent_invocations (id, org_id, project_id, job_id, conversation_id, trigger_message_id, agent_id, requested_by, model_name)
          values ('aaaa1111-1111-1111-1111-111111111198', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', 'aaaa1111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'test-model');`,
    expectError: true,
    expectErrorContains: 'row-level security policy',
  },
  {
    name: 'external job-only member can upload conversation-scoped document in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff0', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'conversation', 'Job Only Upload', 'text/plain', 123, 'vault', 'conv/jobonly-upload.txt', 'uploaded');
          select count(*) from documents where id = 'ffffffff-ffff-ffff-ffff-fffffffffff0';`,
    expect: '1',
  },
  {
    name: 'external job-only member can insert message attachment in own job conversation',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
          values ('ffffffff-ffff-ffff-ffff-fffffffffff0', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'conversation', 'Job Only Attachment Doc', 'text/plain', 123, 'vault', 'conv/jobonly-attach-doc.txt', 'uploaded');
          insert into message_attachments (id, org_id, conversation_id, message_id, document_id)
          values ('88888888-8888-8888-8888-888888888807', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', 'ffffffff-ffff-ffff-ffff-fffffffffff0');
          select count(*) from message_attachments where id = '88888888-8888-8888-8888-888888888807';`,
    expect: '1',
  },
  {
    name: 'document_chunks broad select never returns chunks for inaccessible parent document',
    user: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    sql: `select count(*) from document_chunks where id in (
            '99999999-9999-9999-9999-999999999991',
            '99999999-9999-9999-9999-999999999992',
            '99999999-9999-9999-9999-999999999994',
            '99999999-9999-9999-9999-999999999996'
          )`,
    expect: '0',
  },
  {
    name: 'external editor broad document_chunks select excludes unauthorized org private and mismatched chunks',
    user: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    sql: `select count(*) from document_chunks where id in (
            '99999999-9999-9999-9999-999999999991',
            '99999999-9999-9999-9999-999999999993',
            '99999999-9999-9999-9999-999999999994',
            '99999999-9999-9999-9999-999999999996'
          )`,
    expect: '0',
  },

  // ==========================================================================
  // AGENT PRINCIPAL — project_agents, agent_versions, active-version immutability
  // ==========================================================================
  {
    name: 'org owner can select project_agents for their project',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from project_agents where id = 'aaaa1111-1111-1111-1111-111111111102';`,
    expect: '1',
  },
  {
    name: 'org owner can select agent_versions for linked agent',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `select count(*) from agent_versions where id = 'aaaa1111-1111-1111-1111-111111111120';`,
    expect: '1',
  },
  {
    name: 'active agent version update is blocked by trigger',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `update agent_versions set instructions = 'changed' where id = 'aaaa1111-1111-1111-1111-111111111120';`,
    expectError: true,
    expectErrorContains: 'Cannot modify or delete the active agent version',
  },
  {
    name: 'active agent version delete is blocked by trigger',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `delete from agent_versions where id = 'aaaa1111-1111-1111-1111-111111111120';`,
    expectError: true,
    expectErrorContains: 'Cannot modify or delete the active agent version',
  },
  {
    name: 'new agent version can be inserted and activated via agents.active_version_id',
    user: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sql: `insert into agent_versions (id, org_id, agent_id, status, instructions, model_name)
          values ('aaaa1111-1111-1111-1111-111111111121', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'active', 'Version two instructions.', 'test-model-v2');
          update agents set active_version_id = 'aaaa1111-1111-1111-1111-111111111121' where id = 'aaaa1111-1111-1111-1111-111111111111';
          update agent_versions set instructions = 'Retired version one.' where id = 'aaaa1111-1111-1111-1111-111111111120';
          select instructions from agent_versions where id = 'aaaa1111-1111-1111-1111-111111111120';`,
    expect: 'Retired version one.',
  },
];

// ============================================================================
// Test Runner
// ============================================================================

function runTest(test) {
  // Terminate test body before rollback; without a trailing `;`, PostgreSQL parses
  // `... from t\nrollback` as one invalid statement ("syntax error at or near rollback").
  const body = test.sql.trim();
  const terminated = /;\s*$/.test(body) ? body : `${body};`;

  const fullSql = `begin;
set local role authenticated;
set local request.jwt.claim.sub = '${test.user}';
set local request.jwt.claim.role = 'authenticated';
${terminated}
rollback;`;

  try {
    const result = execFileSync('psql', [RLS_HARNESS_DATABASE_URL, '-v', 'ON_ERROR_STOP=1', '-t', '-A'], {
      input: fullSql,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const actual = result
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !['BEGIN', 'ROLLBACK', 'COMMIT'].includes(line) &&
          line !== 'SET' &&
          !line.startsWith('INSERT '),
      )
      .at(-1);
    if (test.expectError) {
      return {
        passed: false,
        actual,
        error: `Expected RLS error but psql succeeded (last line: ${JSON.stringify(actual ?? '(no stdout after filtering)')})`,
      };
    }
    const passed = actual === test.expect;
    return { passed, actual, error: null };
  } catch (error) {
    if (test.expectError) {
      const combined = execErrorText(error);
      if (test.expectErrorContains && !combined.includes(test.expectErrorContains)) {
        return {
          passed: false,
          actual: null,
          error: `Expected stderr to include ${JSON.stringify(test.expectErrorContains)}; output:\n${combined.slice(0, 1200)}`,
        };
      }
      return { passed: true, actual: 'ERROR_EXPECTED', error: null };
    }
    return { passed: false, actual: null, error: error.message };
  }
}

function setup() {
  console.log('Setting up test fixtures...');

  // Apply fixtures
  const fixturesPath = join(__dirname, 'fixtures.sql');
  execFileSync('psql', [RLS_FIXTURE_DATABASE_URL, '-v', 'ON_ERROR_STOP=1', '-f', fixturesPath], { stdio: 'inherit' });

  console.log('Fixtures applied.\n');
}

function cleanup() {
  console.log('\nCleaning up test fixtures...');

  const cleanupSql = `
    delete from agent_invocations where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from message_attachments where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from document_chunks where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from documents where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from message_mentions where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from messages where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from conversation_user_state where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from agent_members where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    update agents set active_version_id = null where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from agent_versions where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from project_agents where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from agents where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from member_roles where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from conversation_members where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from conversations where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from job_members where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from jobs where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from project_members where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from projects where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from organization_invitations where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from organization_members where org_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from organizations where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
    delete from profiles
    where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
      or auth_user_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
    delete from auth.users where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
  `;

  execFileSync('psql', [RLS_FIXTURE_DATABASE_URL, '-v', 'ON_ERROR_STOP=1'], {
    input: cleanupSql,
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  console.log('Cleanup complete.');
}

function assertHarnessSubjectToRls() {
  const sql = `select coalesce((select rolsuper or rolbypassrls from pg_roles where rolname = current_user), true);`;
  const out = execFileSync('psql', [RLS_HARNESS_DATABASE_URL, '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8',
  }).trim();

  if (out === 't' || out === 'true') {
    console.error(
      [
        'RLS harness connection bypasses row security (superuser or BYPASSRLS).',
        'Policies will not be enforced — use a normal role (CI: set RLS_TEST_DATABASE_URL to rls_ci; see supabase/ci/mock_supabase_minimal.sql).',
        `Check query returned: ${JSON.stringify(out)} for ${RLS_HARNESS_DATABASE_URL.replace(/:[^:@/]+@/, ':****@')}`,
      ].join('\n'),
    );
    process.exit(1);
  }
}

function main() {
  let passed = 0;
  let failed = 0;

  try {
    verifyPolicyDocs();
    console.log('Verified packages/db/README.md (service role bypass discipline).\n');

    assertHarnessSubjectToRls();

    setup();

    console.log('Running RLS integration tests...\n');

    for (const test of TESTS) {
      const result = runTest(test);

      if (result.passed) {
        console.log(`✓ ${test.name}`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        const expectedLabel = test.expectError
          ? `error${test.expectErrorContains ? ` containing ${JSON.stringify(test.expectErrorContains)}` : ''}`
          : test.expect;
        console.log(`  Expected: ${expectedLabel}`);
        console.log(`  Actual: ${result.actual ?? 'ERROR'}`);
        if (test.tripwireHint) {
          console.log(`  Tripwire: ${test.tripwireHint}`);
        }
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
        failed++;
      }
    }

    console.log(`\n${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    cleanup();
  }
}

main();
