-- RLS integration test fixtures — `scripts/rls/test/fixtures.sql`
--
-- Deterministic hex UUIDs (projects/jobs/memberships use 1111…/2222… prefixes).
-- Load order: orgs → auth.users → profiles → projects → jobs → memberships → rest.
--
-- | Profile   | Org / project / job                         | ccc1 (internal-created) | ccc3 (jobonly-owned) |
-- |-----------|---------------------------------------------|---------------------------|----------------------|
-- | internal1 | Alpha internal, project+job Alpha           | member (editor)           | —                    |
-- | internal2 | Alpha internal, project Alpha+Beta, job Beta| — (project grant only)    | —                    |
-- | ext editor| job Alpha customer + conv member (editor) | member (editor)           | —                    |
-- | ext viewer| conv member (viewer) only                 | member (viewer)           | —                    |
-- | job only  | job Alpha customer, no conv member on ccc1  | — (denied via job grant)  | owner                |

-- Test orgs
insert into organizations (id, name, slug, plan)
values
  ('11111111-1111-1111-1111-111111111111', 'Test Org Alpha', 'test-org-alpha', 'starter'),
  ('22222222-2222-2222-2222-222222222222', 'Test Org Beta', 'test-org-beta', 'starter');

-- Test auth users (in auth.users, mocked in CI)
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal1@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'internal2@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'external@example.com'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'viewer@example.com'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'jobonly@example.com');

-- Test profiles
insert into profiles (id, auth_user_id, display_name, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Internal User 1', 'internal1@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Internal User 2', 'internal2@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'External Editor', 'external@example.com'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'External Viewer', 'viewer@example.com'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Job Only External', 'jobonly@example.com')
on conflict (auth_user_id) do update
set
  id = excluded.id,
  display_name = excluded.display_name,
  email = excluded.email;

-- Projects (after profiles — created_by FK)
insert into projects (id, org_id, key, name, status, created_by)
values
  ('11111111-aaaa-aaaa-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'alpha', 'Alpha Project', 'active', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-bbbb-bbbb-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'beta', 'Beta Project', 'active', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Customer jobs
insert into jobs (id, org_id, project_id, customer_profile_id, title, status, created_by)
values
  ('11111111-cccc-cccc-cccc-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alpha Customer Job', 'open', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-dddd-dddd-dddd-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beta Customer Job', 'open', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Organization memberships
insert into organization_members (id, org_id, user_id, member_type, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'internal', 'active');

-- Project and job membership
insert into project_members (id, org_id, project_id, user_id, project_role)
values
  ('11111111-aaaa-aaaa-aaaa-111111111101', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'member'),
  ('11111111-aaaa-aaaa-aaaa-111111111102', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member'),
  ('22222222-bbbb-bbbb-bbbb-222222222102', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'member');

insert into job_members (id, org_id, project_id, job_id, user_id, member_kind)
values
  ('11111111-cccc-cccc-cccc-111111111101', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'internal'),
  ('11111111-cccc-cccc-cccc-111111111102', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'customer'),
  ('11111111-cccc-cccc-cccc-111111111103', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'customer'),
  ('22222222-dddd-dddd-dddd-222222222102', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'internal');

-- RBAC: system Owner role (seeded by rls sync) so has_org_permission(...) matches policies
insert into member_roles (org_id, user_id, role_id, assigned_by)
select '11111111-1111-1111-1111-111111111111', p.id, r.id, p.id
from profiles p
cross join roles r
where p.id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
  and r.org_id is null
  and r.key = 'owner';

-- Organisation invitation (RLS coverage)
insert into organization_invitations (id, org_id, email, member_type, token_hash, status, invited_by, expires_at)
values
  (
    '77777777-7777-7777-7777-777777777701',
    '11111111-1111-1111-1111-111111111111',
    'pending-invite@example.com',
    'internal',
    'fixture-org-invite-token-hash',
    'pending',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now() + interval '7 days'
  );

-- Agent (invocation coverage)
insert into agents (id, org_id, key, name, status, created_by)
values
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'alpha-assistant', 'Alpha Assistant', 'active', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into project_agents (id, org_id, project_id, agent_id, visibility)
values
  ('aaaa1111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'restricted');

insert into agent_versions (id, org_id, agent_id, version, status, instructions, model_name, created_by)
values
  ('aaaa1111-1111-1111-1111-111111111120', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 1, 'active', 'You are Alpha Assistant.', 'test-model', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

update agents
set active_version_id = 'aaaa1111-1111-1111-1111-111111111120'
where id = 'aaaa1111-1111-1111-1111-111111111111';

insert into agent_members (id, org_id, agent_id, subject_type, subject_id, access, created_by)
values
  ('aaaa1111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'invoker', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Conversations
insert into conversations (id, org_id, project_id, job_id, title, created_by)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'Org Alpha Conversation', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'Org Beta Conversation', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'Job Only External Conversation', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

-- Conversation members
insert into conversation_members (id, org_id, project_id, job_id, conversation_id, subject_type, subject_id, access_level)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'editor'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'editor'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'user', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'editor'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'viewer'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd05', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'agent', 'aaaa1111-1111-1111-1111-111111111111', 'viewer');

-- Messages
insert into messages (id, org_id, project_id, job_id, conversation_id, sender_type, sender_id, body)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Message in Org Alpha conversation'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'user', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Message in Org Beta conversation'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mismatched org message'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'user', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Message in job-only external conversation');

insert into message_mentions (id, org_id, project_id, job_id, message_id, conversation_id, target_type, target_id, mention_text)
values
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'user', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '@external-editor');

insert into conversation_user_state (org_id, project_id, job_id, conversation_id, user_id)
values ('11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Documents
insert into documents (id, org_id, project_id, job_id, owner_id, conversation_id, scope, name, mime_type, size_bytes, storage_bucket, storage_path, status)
values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', null, null, null, 'org', 'Org Vault Doc', 'text/plain', 100, 'vault', 'org/vault-doc.txt', 'indexed'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'Conversation Doc', 'text/plain', 100, 'vault', 'conv/conv-doc.txt', 'indexed'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'private', 'Private Doc', 'text/plain', 100, 'vault', 'private/private-doc.txt', 'indexed'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff6', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', '22222222-dddd-dddd-dddd-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'Mismatched Conversation Doc', 'text/plain', 100, 'vault', 'conv/mismatched-doc.txt', 'indexed'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffa', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '11111111-cccc-cccc-cccc-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'conversation', 'Job Only Conversation Doc', 'text/plain', 100, 'vault', 'conv/jobonly-doc.txt', 'indexed'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffb', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', '22222222-dddd-dddd-dddd-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'conversation', 'Mismatched Job Conversation Doc', 'text/plain', 100, 'vault', 'conv/mismatched-job-doc.txt', 'indexed');

-- Document chunks
insert into document_chunks (id, org_id, project_id, document_id, chunk_index, content, token_count)
values
  ('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 0, 'Org vault chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10),
  ('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 0, 'Conversation chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10),
  ('99999999-9999-9999-9999-999999999993', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 0, 'Private chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10),
  ('99999999-9999-9999-9999-999999999994', '22222222-2222-2222-2222-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', 'ffffffff-ffff-ffff-ffff-fffffffffff6', 0, 'Mismatched document chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10),
  ('99999999-9999-9999-9999-999999999995', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffffa', 0, 'Job only conversation chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10),
  ('99999999-9999-9999-9999-999999999996', '11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffffb', 0, 'Mismatched job document chunk content __AIDA_RLS_FIXTURE_RETRIEVAL_LEX__', 10);

update document_chunks
set embedding = ('[' || repeat('0.001,', 1023) || '0.001]')::vector
where id in (
  '99999999-9999-9999-9999-999999999991',
  '99999999-9999-9999-9999-999999999992',
  '99999999-9999-9999-9999-999999999993',
  '99999999-9999-9999-9999-999999999994',
  '99999999-9999-9999-9999-999999999995',
  '99999999-9999-9999-9999-999999999996'
);

-- Message attachments
insert into message_attachments (id, org_id, conversation_id, message_id, document_id)
values
  ('88888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ffffffff-ffff-ffff-ffff-fffffffffff2'),
  ('88888888-8888-8888-8888-888888888802', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'ffffffff-ffff-ffff-ffff-fffffffffff2'),
  ('88888888-8888-8888-8888-888888888806', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', 'ffffffff-ffff-ffff-ffff-fffffffffffa');
