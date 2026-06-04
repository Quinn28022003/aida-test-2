-- AIDA-MVP-004 core schema migration
--
-- Canonical design reference: docs/db-schema.md ("Design reference (canonical)").
-- Migrations remain the source of truth; the doc is for review and onboarding.
--
-- Rollback notes
--   Type:        Local migration down only. Production rollback is forward-fix.
--   Data loss:   Local rollback drops every table and enum created here. No
--                seed data ships in this migration.
--   Local cmd:   pnpm exec supabase db reset
--                # or, this migration only, against a local DB url:
--                psql "$LOCAL_SUPABASE_DB_URL" -f \
--                  supabase/rollback/down/20260509064221_aida_mvp_core_schema_down.sql
--   Production:  Forward-fix only. Do not run the down script against shared
--                environments. Once shipped, never edit this file; author a
--                corrective migration instead.
--   Expand/contract: N/A for the first migration. The rule still applies to
--                future destructive changes.

-- ======== Extensions ========

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ======== Enums ========

create type member_type as enum ('internal', 'service');
create type member_status as enum ('invited', 'active', 'suspended', 'removed');
create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type subject_type as enum ('user', 'group', 'role', 'agent', 'conversation');
create type access_level as enum ('viewer', 'participant', 'moderator', 'owner');
create type sender_type as enum ('user', 'agent', 'router', 'system', 'tool');
create type conversation_status as enum ('open', 'waiting', 'resolved', 'archived');
create type conversation_priority as enum ('low', 'normal', 'high', 'urgent');
create type agent_status as enum ('draft', 'active', 'disabled', 'archived');
create type agent_version_status as enum ('draft', 'active', 'archived');
create type document_scope as enum ('org', 'group', 'agent', 'conversation', 'private');
create type document_status as enum ('upload_pending', 'uploaded', 'extracting', 'chunking', 'embedding', 'indexed', 'failed', 'deleted');
create type vault_resource_status as enum ('active', 'trashed', 'deleted');
create type invocation_status as enum ('queued', 'running', 'completed', 'failed', 'canceled', 'requires_approval');
create type tool_risk_level as enum ('low', 'medium', 'high');
create type task_status as enum ('todo', 'in_progress', 'blocked', 'done', 'canceled');
create type task_checklist_item_status as enum ('todo', 'in_progress', 'blocked', 'done', 'skipped');
create type project_status as enum ('active', 'archived');
create type project_member_role as enum ('owner', 'admin', 'member');
create type customer_job_status as enum ('open', 'closed', 'archived');
create type background_job_status as enum ('queued', 'running', 'completed', 'failed', 'dead_letter', 'canceled');
create type agent_member_access as enum ('viewer', 'invoker', 'manager');

-- ======== Identity ========

create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  avatar_url text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  data_region text not null default 'default',
  default_locale text not null default 'en-US',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  member_type member_type not null default 'internal',
  status member_status not null default 'active',
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index organization_members_user_idx on organization_members(user_id);
create index organization_members_org_status_idx on organization_members(org_id, status);

create table organization_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  member_type member_type not null default 'internal',
  initial_role_keys text[] not null default '{}',
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references profiles(id),
  accepted_by uuid references profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index organization_invitations_pending_email_idx
  on organization_invitations(org_id, lower(email))
  where status = 'pending';
create index organization_invitations_email_idx on organization_invitations(lower(email), status);
create index organization_invitations_org_status_idx on organization_invitations(org_id, status);

-- ======== RBAC ========

create table permissions (
  key text primary key,
  description text not null
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table member_roles (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id, role_id)
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table group_members (
  org_id uuid not null references organizations(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table group_roles (
  org_id uuid not null references organizations(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (group_id, role_id)
);

create table subject_permission_grants (
  org_id uuid not null references organizations(id) on delete cascade,
  subject_type text not null check (subject_type in ('user', 'group')),
  subject_id uuid not null,
  permission_key text not null references permissions(key) on delete cascade,
  granted_by uuid references profiles(id),
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (org_id, subject_type, subject_id, permission_key)
);

create index member_roles_lookup_idx on member_roles(org_id, user_id);
create index group_members_lookup_idx on group_members(org_id, user_id);
create index subject_permission_grants_lookup_idx
  on subject_permission_grants(org_id, subject_type, subject_id, permission_key);

-- ======== Projects & work items ========

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  status project_status not null default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, key)
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  project_role project_member_role not null default 'member',
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  customer_profile_id uuid not null,
  external_ref text,
  title text not null,
  status customer_job_status not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  member_kind text not null check (member_kind in ('internal', 'customer')),
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, user_id)
);

create table job_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  email text not null,
  access_level access_level not null default 'participant',
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references profiles(id),
  accepted_by uuid references profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_org_status_idx on projects(org_id, status);
create index project_members_user_idx on project_members(org_id, user_id);
create index jobs_project_status_idx on jobs(project_id, status, updated_at desc);
create index job_members_user_idx on job_members(org_id, user_id);
create unique index job_invitations_pending_email_idx
  on job_invitations(org_id, job_id, lower(email))
  where status = 'pending';
create index job_invitations_email_idx on job_invitations(lower(email), status);
create index job_invitations_job_status_idx on job_invitations(job_id, status);

-- ======== Agents ========

create table agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  status agent_status not null default 'draft',
  visibility text not null default 'restricted',
  active_version_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, key)
);

create table agent_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  version integer not null,
  status agent_version_status not null default 'draft',
  instructions text not null,
  model_provider text not null default 'bedrock',
  model_name text not null,
  model_profile text not null default 'balanced',
  temperature numeric(3,2) not null default 0.2,
  max_output_tokens integer not null default 2048,
  response_policy jsonb not null default '{}'::jsonb,
  memory_policy jsonb not null default '{}'::jsonb,
  rag_policy jsonb not null default '{}'::jsonb,
  tool_policy jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (agent_id, version)
);

alter table agents
  add constraint agents_active_version_fk
  foreign key (active_version_id) references agent_versions(id);

create table agent_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  subject_type text not null check (subject_type in ('user', 'group', 'role')),
  subject_id uuid not null,
  access agent_member_access not null default 'invoker',
  created_by uuid references profiles(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agent_id, subject_type, subject_id)
);

create table agent_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  email text not null,
  access agent_member_access not null default 'invoker',
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references profiles(id),
  accepted_by uuid references profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agents_project_status_idx on agents(project_id, status);
create index agent_members_subject_idx
  on agent_members(org_id, project_id, subject_type, subject_id);
create unique index agent_invitations_pending_email_idx
  on agent_invitations(org_id, agent_id, lower(email))
  where status = 'pending';
create index agent_invitations_email_idx on agent_invitations(lower(email), status);
create index agent_invitations_agent_status_idx on agent_invitations(agent_id, status);

-- ======== Conversations ========

create table conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  title text not null default 'Untitled conversation',
  status conversation_status not null default 'open',
  priority conversation_priority not null default 'normal',
  created_by uuid not null references profiles(id),
  primary_agent_id uuid references agents(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  subject_type subject_type not null,
  subject_id uuid not null,
  access_level access_level not null default 'participant',
  added_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (conversation_id, subject_type, subject_id)
);

create table conversation_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  email text not null,
  access_level access_level not null default 'participant',
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references profiles(id),
  accepted_by uuid references profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type sender_type not null,
  sender_id uuid,
  body text,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'sent',
  parent_message_id uuid references messages(id),
  client_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_user_state (
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_message_id uuid references messages(id) on delete set null,
  last_read_at timestamptz,
  last_seen_at timestamptz,
  muted_at timestamptz,
  archived_at timestamptz,
  pinned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table message_mentions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  target_type subject_type not null,
  target_id uuid not null,
  mention_text text not null,
  created_at timestamptz not null default now()
);

create table agent_invocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  trigger_message_id uuid not null references messages(id),
  response_message_id uuid references messages(id),
  agent_id uuid not null references agents(id),
  agent_version_id uuid references agent_versions(id),
  requested_by uuid references profiles(id),
  status invocation_status not null default 'queued',
  model_provider text not null default 'bedrock',
  model_name text not null,
  token_input integer,
  token_output integer,
  latency_ms integer,
  prompt_log jsonb,
  output_log jsonb,
  reasoning_trace jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create table support_handoffs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  requested_by uuid references profiles(id),
  target_type text not null check (target_type in ('user', 'group', 'role', 'queue')),
  target_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'notified', 'accepted', 'resolved', 'canceled')),
  reason text,
  summary text,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  accepted_by uuid references profiles(id),
  accepted_at timestamptz,
  resolved_at timestamptz
);

create table support_handoff_notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  handoff_id uuid not null references support_handoffs(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'slack')),
  provider text not null,
  recipient text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table background_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  customer_job_id uuid references jobs(id) on delete set null,
  type text not null,
  payload jsonb not null,
  status background_job_status not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_job_updated_idx on conversations(job_id, updated_at desc);
create index conversation_members_subject_idx
  on conversation_members(org_id, project_id, job_id, subject_type, subject_id);
create index conversation_invitations_email_idx on conversation_invitations(lower(email), status);
create index conversation_invitations_conversation_status_idx
  on conversation_invitations(conversation_id, status);
create index messages_conversation_created_idx on messages(conversation_id, created_at);
create index conversation_user_state_user_idx on conversation_user_state(org_id, user_id, updated_at desc);
create index message_mentions_target_idx on message_mentions(org_id, target_type, target_id);
create index agent_invocations_conversation_idx on agent_invocations(conversation_id, created_at desc);
create index support_handoffs_conversation_idx on support_handoffs(conversation_id, created_at desc);
create index support_handoff_notifications_status_idx
  on support_handoff_notifications(org_id, status, created_at);
create index background_jobs_ready_idx on background_jobs(status, run_after, created_at);

-- ======== Vault & RAG ========

create table vault_folders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  parent_folder_id uuid references vault_folders(id) on delete cascade,
  name text not null,
  status vault_resource_status not null default 'active',
  created_by uuid references profiles(id),
  deleted_by uuid references profiles(id),
  deleted_at timestamptz,
  restore_until timestamptz,
  hard_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, parent_folder_id, name)
);

create table knowledge_hubs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  status vault_resource_status not null default 'active',
  created_by uuid references profiles(id),
  deleted_by uuid references profiles(id),
  deleted_at timestamptz,
  restore_until timestamptz,
  hard_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  owner_id uuid references profiles(id),
  vault_folder_id uuid references vault_folders(id) on delete set null,
  conversation_id uuid references conversations(id) on delete cascade,
  scope document_scope not null,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_bucket text not null,
  storage_path text not null,
  checksum text,
  status document_status not null default 'uploaded',
  extraction_metadata jsonb not null default '{}'::jsonb,
  ingestion_attempts integer not null default 0,
  ingestion_max_attempts integer not null default 3,
  ingestion_error jsonb,
  ingestion_last_failed_at timestamptz,
  ingestion_next_retry_at timestamptz,
  sensitivity text not null default 'normal',
  deleted_by uuid references profiles(id),
  deleted_at timestamptz,
  restore_until timestamptz,
  hard_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table knowledge_hub_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  knowledge_hub_id uuid not null references knowledge_hubs(id) on delete cascade,
  item_type text not null check (item_type in ('file', 'folder')),
  document_id uuid references documents(id) on delete cascade,
  folder_id uuid references vault_folders(id) on delete cascade,
  added_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (
    (item_type = 'file' and document_id is not null and folder_id is null)
    or (item_type = 'folder' and folder_id is not null and document_id is null)
  ),
  unique (knowledge_hub_id, item_type, document_id, folder_id)
);

create table document_acl (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  subject_type subject_type not null,
  subject_id uuid not null,
  permission text not null check (permission in ('view', 'edit', 'manage', 'retrieve')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (document_id, subject_type, subject_id, permission)
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1024),
  embedding_model text,
  embedding_version text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table document_chunk_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  chunk_id uuid not null references document_chunks(id) on delete cascade,
  page_number integer,
  section_title text,
  bounding_box jsonb,
  created_at timestamptz not null default now()
);

create table message_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  access_scope text not null default 'conversation',
  created_at timestamptz not null default now(),
  unique (message_id, document_id)
);

create table retrieval_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  candidate_chunk_ids uuid[] not null default '{}',
  selected_chunk_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index documents_org_status_idx on documents(org_id, status);
create index documents_conversation_idx on documents(org_id, conversation_id);
create index vault_folders_trash_idx
  on vault_folders(org_id, status, deleted_at);
create index knowledge_hubs_trash_idx
  on knowledge_hubs(org_id, status, deleted_at);
create index documents_trash_idx
  on documents(org_id, status, deleted_at)
  where status = 'deleted';
create index knowledge_hub_items_hub_idx
  on knowledge_hub_items(knowledge_hub_id, item_type, created_at);
create index document_acl_subject_idx on document_acl(org_id, subject_type, subject_id);
create index document_chunks_document_idx on document_chunks(document_id, chunk_index);
create index document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops)
  where embedding is not null and deleted_at is null;

-- ======== Memory ========

create table memory_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  scope_type text not null check (scope_type in ('conversation', 'user', 'agent', 'org', 'router')),
  scope_id uuid not null,
  key text not null,
  value jsonb not null,
  confidence numeric(3,2) not null default 1.0,
  source_message_id uuid references messages(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, scope_type, scope_id, key)
);

create table conversation_memory (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  key text not null,
  value jsonb not null,
  confidence numeric(3,2) not null default 1.0,
  source_message_id uuid references messages(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, conversation_id, key)
);

create table conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  scope_type text not null default 'conversation'
    check (scope_type in ('conversation', 'user', 'agent')),
  scope_id uuid,
  summary text not null,
  covered_message_from uuid references messages(id),
  covered_message_to uuid references messages(id),
  token_count integer not null,
  created_at timestamptz not null default now()
);

create table router_preferences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  subject_type text not null check (subject_type in ('user', 'group', 'role', 'org')),
  subject_id uuid,
  intent_key text not null,
  agent_id uuid references agents(id) on delete cascade,
  mode text not null check (mode in ('ask', 'always_allow', 'never')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, subject_type, subject_id, intent_key, agent_id),
  check (
    (subject_type = 'org' and subject_id is null)
    or (subject_type <> 'org' and subject_id is not null)
  )
);

create index conversation_memory_lookup_idx
  on conversation_memory(org_id, conversation_id, key);
create index conversation_summaries_lookup_idx
  on conversation_summaries(org_id, conversation_id, scope_type, scope_id, created_at desc);
create index router_preferences_lookup_idx
  on router_preferences(org_id, subject_type, subject_id, intent_key, agent_id);

-- ======== Tasks ========

create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  due_at timestamptz,
  reminder_offset_minutes integer not null default 60,
  reminder_sent_at timestamptz,
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  source_message_id uuid references messages(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  label text not null,
  status task_checklist_item_status not null default 'todo',
  position integer not null default 0,
  assigned_to uuid references profiles(id),
  due_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_checklist_items_task_idx
  on task_checklist_items(task_id, position);
create index tasks_due_reminder_idx
  on tasks(org_id, status, due_at)
  where status in ('todo', 'in_progress', 'blocked')
    and due_at is not null
    and reminder_sent_at is null;

-- ======== Forms ========

create table forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  embed_token_hash text unique,
  ai_validation_summary jsonb,
  ai_validated_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table form_fields (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  form_id uuid not null references forms(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  field_type text not null check (field_type in ('short_text', 'long_text', 'email', 'phone', 'number', 'date', 'single_choice', 'multiple_choice', 'file_upload')),
  required boolean not null default false,
  options jsonb not null default '{}'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  ai_hint text,
  ai_hint_quality_score integer check (ai_hint_quality_score between 1 and 10),
  ai_hint_validation jsonb,
  ai_hint_validated_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, key)
);

create table form_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  form_id uuid not null references forms(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'abandoned')),
  respondent_profile_id uuid references profiles(id),
  respondent_email text,
  session_id uuid,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table form_response_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  response_id uuid not null references form_responses(id) on delete cascade,
  field_id uuid not null references form_fields(id) on delete cascade,
  document_id uuid references documents(id) on delete set null,
  value jsonb not null default 'null'::jsonb,
  confidence numeric,
  source jsonb,
  filled_by text not null check (filled_by in ('user', 'agent')),
  updated_at timestamptz not null default now(),
  unique (response_id, field_id)
);

create table form_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  form_id uuid not null references forms(id) on delete cascade,
  response_id uuid not null references form_responses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'submitted', 'expired')),
  agent_invocation_id uuid references agent_invocations(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table form_session_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  form_id uuid not null references forms(id) on delete cascade,
  response_id uuid not null references form_responses(id) on delete cascade,
  session_id uuid not null references form_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('respondent_message', 'agent_message', 'set_value', 'validation_error', 'submit_ready', 'submitted')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index forms_org_status_idx on forms(org_id, status, updated_at desc);
create index form_fields_form_position_idx on form_fields(form_id, position);
create index form_responses_form_status_idx on form_responses(form_id, status, created_at desc);
create index form_sessions_response_idx on form_sessions(response_id, status);
create index form_session_events_session_idx on form_session_events(session_id, created_at);

-- ======== Tools, Plugins, Integrations, Approvals ========

create table tools (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  plugin_id uuid,
  key text not null,
  name text not null,
  description text not null,
  type text not null check (type in ('built_in', 'internal_api', 'mcp', 'plugin')),
  schema jsonb not null,
  auth_policy jsonb not null default '{}'::jsonb,
  required_platform_capabilities text[] not null default '{}',
  required_external_scopes text[] not null default '{}',
  resource_scope_requirements jsonb not null default '[]'::jsonb,
  risk_level tool_risk_level not null default 'low',
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

create table plugins (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  publisher_name text,
  status text not null default 'draft' check (status in ('draft', 'active', 'disabled', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tools
  add constraint tools_plugin_id_fk
  foreign key (plugin_id) references plugins(id) on delete cascade;

create table plugin_installations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plugin_id uuid not null references plugins(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'disabled', 'uninstalled')),
  config jsonb not null default '{}'::jsonb,
  installed_by uuid references profiles(id),
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, plugin_id)
);

create table plugin_ui_panels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  plugin_id uuid not null references plugins(id) on delete cascade,
  key text not null,
  name text not null,
  iframe_url text not null,
  allowed_origins text[] not null default '{}',
  required_permissions text[] not null default '{}',
  placement text not null check (placement in ('conversation_side_panel', 'message_action', 'resource_panel')),
  status text not null default 'draft' check (status in ('draft', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, plugin_id, key)
);

create table plugin_data_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plugin_id uuid not null references plugins(id) on delete cascade,
  installation_id uuid not null references plugin_installations(id) on delete cascade,
  collection_key text not null,
  record_key text not null,
  owner_subject_type text not null check (owner_subject_type in ('user', 'group', 'role', 'agent', 'conversation', 'plugin')),
  owner_subject_id uuid,
  visibility text not null default 'plugin' check (visibility in ('private', 'org', 'conversation', 'plugin')),
  data jsonb not null default '{}'::jsonb,
  search_text text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (installation_id, collection_key, record_key)
);

create table integration_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  auth_type text not null check (auth_type in ('oauth_user', 'oauth_org', 'service_account', 'api_key')),
  granted_external_scopes text[] not null default '{}',
  connected_by uuid references profiles(id),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table integration_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  connection_id uuid not null references integration_connections(id) on delete cascade,
  credential_type text not null check (credential_type in ('oauth_token', 'api_key', 'service_token')),
  encrypted_secret bytea not null,
  encryption_key_id text not null,
  nonce bytea not null,
  algorithm text not null default 'aes-256-gcm',
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table external_resource_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  connection_id uuid not null references integration_connections(id) on delete cascade,
  provider text not null,
  resource_type text not null,
  external_resource_id text not null,
  display_name text,
  granted_to_type text not null check (granted_to_type in ('user', 'group', 'role', 'agent', 'plugin')),
  granted_to_id uuid not null,
  action text not null check (action in ('read', 'write', 'sync', 'retrieve', 'manage')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (connection_id, resource_type, external_resource_id, granted_to_type, granted_to_id, action)
);

create table agent_tools (
  org_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  policy jsonb not null default '{}'::jsonb,
  primary key (agent_id, tool_id)
);

create table tool_invocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  agent_invocation_id uuid references agent_invocations(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  tool_id uuid references tools(id) on delete restrict,
  status invocation_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  requested_by_type text not null check (requested_by_type in ('user', 'agent', 'system')),
  requested_by_id uuid,
  approver_id uuid references profiles(id),
  resource_type text not null,
  resource_id uuid not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'expired')),
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index integration_connections_org_provider_idx
  on integration_connections(org_id, provider, status);
create index plugin_installations_org_idx
  on plugin_installations(org_id, status);
create index plugin_ui_panels_plugin_idx
  on plugin_ui_panels(plugin_id, placement, status);
create index plugin_data_records_lookup_idx
  on plugin_data_records(org_id, plugin_id, collection_key, record_key);
create index plugin_data_records_owner_idx
  on plugin_data_records(org_id, owner_subject_type, owner_subject_id, collection_key);
create index plugin_data_records_search_idx
  on plugin_data_records using gin (search_text gin_trgm_ops);
create index integration_credentials_connection_idx
  on integration_credentials(connection_id, status);
create index external_resource_grants_subject_idx
  on external_resource_grants(org_id, granted_to_type, granted_to_id, provider, action);
create index external_resource_grants_resource_idx
  on external_resource_grants(connection_id, resource_type, external_resource_id);

-- ======== Audit ========

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'agent', 'system', 'service')),
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_events_org_created_idx on audit_events(org_id, created_at desc);
create index audit_events_resource_idx on audit_events(org_id, resource_type, resource_id);

-- ======== Comments (policy-sensitive fields) ========

comment on column organizations.data_region is
  'Residency region or deployment partition. Provisioning, storage, Bedrock calls, backups, logs, and background jobs must use matching regional resources when enterprise policy requires residency.';

comment on table organization_members is
  'A profile may belong to multiple organizations through separate rows. The (org_id, user_id) uniqueness only prevents duplicate membership within one org.';

comment on column organization_invitations.token_hash is
  'Hash of the single-use invitation token. Never store the plaintext. Public lookup may repeat while status = ''pending'', accepted_at is null, and expires_at > now().';

comment on column organization_invitations.expires_at is
  'Sender-chosen expiry, capped by platform policy. Acceptance must verify token hash, pending status, expiry, and authenticated email match in a single transaction.';

comment on table subject_permission_grants is
  'Narrow user-or-group exceptions on top of role membership. Use sparingly; direct grants are harder to audit than role membership.';

comment on column conversation_invitations.token_hash is
  'Single-accept conversation invitation token (hashed). Same rules as organization_invitations.token_hash.';

comment on column agent_invocations.prompt_log is
  'Retained model invocation prompt. Redact or encrypt at write time per org policy. No purge field until retention workers exist.';

comment on column agent_invocations.output_log is
  'Retained model invocation output. Redact or encrypt at write time per org policy. No purge field until retention workers exist.';

comment on column agent_invocations.reasoning_trace is
  'Product-visible reasoning steps (plan, retrieved sources, tool calls, answer rationale). Must not store raw hidden model chain-of-thought.';

comment on column background_jobs.status is
  '''dead_letter'' is terminal; replays must clone the row with a new id. Document ingestion jobs must update document failure fields before entering dead_letter so the UI shows a stable failed state.';

comment on column job_invitations.token_hash is
  'Single-accept job invitation token (hashed). Same rules as organization_invitations.token_hash. Acceptance grants job_members with the invited access_level.';

comment on column agent_invitations.token_hash is
  'Single-accept agent invitation token (hashed). Same rules as organization_invitations.token_hash.';

comment on column agent_invitations.access is
  'Granted agent_member_access when the invite is accepted. Invoker allows model use; manager includes configuration changes per product policy.';

comment on table agent_members is
  'Primary agent-scoped access control. subject_type is limited to user, group, or role. Revoke by setting revoked_at rather than deleting historical rows.';

comment on table conversation_memory is
  'Conversation-scoped durable memory distinct from generic memory_items. Use for per-thread facts the product surfaces in chat context.';

comment on column documents.ingestion_attempts is
  'Drives retry UI and worker scheduling. When attempts reach ingestion_max_attempts the document stays failed until a user or agent requests reindex.';

comment on column documents.deleted_at is
  'Vault trash. documents use status = ''deleted''. deleted_at, deleted_by, restore_until drive the Trash UI; hard_deleted_at records permanent deletion.';

comment on column vault_folders.status is
  'Folders move ''active'' -> ''trashed'' -> ''deleted''. Folder trash marks the subtree as trashed; it does not cascade-delete child rows during the restore window.';

comment on column knowledge_hubs.status is
  'Hubs move ''active'' -> ''trashed'' -> ''deleted''. Restoring requires an active parent or a new destination.';

comment on table knowledge_hub_items is
  'Hubs are collections of files and folders. Training/indexing remains per file via documents/document_chunks; a hub does not have its own training pipeline. Hub status is a derived aggregate over included files.';

comment on column document_chunks.embedding is
  'Embedding dimension must match the selected Bedrock embedding model. Update vector(N) before locking production migrations if the model changes.';

comment on column document_chunks.deleted_at is
  'Soft-deleted chunks are excluded from retrieval. A cleanup job purges old deleted chunks so pgvector indexes do not retain dead embeddings indefinitely.';

comment on column tasks.progress is
  'Derived from checklist completion (completed / total). Updated by the application service or built-in task tool when checklist items change. Direct user-entered percentages are not part of the model.';

comment on column tasks.reminder_offset_minutes is
  'Reminders fire at due_at - reminder_offset_minutes. Default is one hour before due_at. Reminder delivery updates reminder_sent_at.';

comment on column forms.ai_validation_summary is
  'Overall result of form authoring AI validation across all fields. Per-field results live in form_fields.ai_hint_validation.';

comment on column form_fields.ai_hint_quality_score is
  'Authoring aid only (1-10). Must not block publish unless product policy later adds a publish gate.';

comment on table form_session_events is
  'Public respondent <-> guided-agent transcript. Compact tool-event cards live in messages.content (kind = tool_event, toolKey = forms); the full transcript belongs here, not in messages.';

comment on table integration_connections is
  'Required only for AIDA-managed connectors where the platform performs preflight checks and admin configuration. Third-party remote tools may manage provider authorization internally and report failures via tool_invocations.error.';

comment on column integration_credentials.encrypted_secret is
  'AES-256-GCM ciphertext. Key referenced by encryption_key_id; nonce stored in nonce. Never log the plaintext or expose it to frontend code.';

comment on table plugin_data_records is
  'AIDA-hosted durable state for SDK-built tools. Plugins do not create core schema tables. Use this for metadata, settings, lightweight workflow state, cache snapshots, and searchable JSON. Large files go through object storage.';

comment on column tools.plugin_id is
  'Set when the tool is provided by a plugin (type = ''plugin''). Built-in product tools (e.g. tasks, forms) leave this null and write through their own first-class tables.';
