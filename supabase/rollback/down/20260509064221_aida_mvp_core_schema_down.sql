-- AIDA-MVP-004 core schema rollback (local only)
--
-- Use only against a local or disposable Supabase database. Never run on a
-- shared development, staging, or production project: it drops every table
-- and enum created by the matching up migration.
--
-- Local usage:
--   psql "$LOCAL_SUPABASE_DB_URL" \
--     -f supabase/rollback/down/20260509064221_aida_mvp_core_schema_down.sql
--
-- Or for a full local reset (re-applies every migration from scratch):
--   pnpm exec supabase db reset
--
-- Production rollback for this first migration is forward-fix only. See the
-- header of the matching up migration and docs/db-schema.md for policy.
--
-- Extensions (uuid-ossp, pgcrypto, vector, pg_trgm) are intentionally left in
-- place because they may be shared with other tooling on the same database.

-- Tables: drop in reverse dependency order with cascade so dependent indexes,
-- constraints, triggers, and policies are removed alongside their tables.

drop table if exists audit_events cascade;

drop table if exists approvals cascade;
drop table if exists tool_invocations cascade;
drop table if exists agent_tools cascade;
drop table if exists external_resource_grants cascade;
drop table if exists integration_credentials cascade;
drop table if exists integration_connections cascade;
drop table if exists plugin_data_records cascade;
drop table if exists plugin_ui_panels cascade;
drop table if exists plugin_installations cascade;
drop table if exists plugins cascade;
drop table if exists tools cascade;

drop table if exists form_session_events cascade;
drop table if exists form_sessions cascade;
drop table if exists form_response_values cascade;
drop table if exists form_responses cascade;
drop table if exists form_fields cascade;
drop table if exists forms cascade;

drop table if exists task_checklist_items cascade;
drop table if exists tasks cascade;

drop table if exists router_preferences cascade;
drop table if exists conversation_summaries cascade;
drop table if exists conversation_memory cascade;
drop table if exists memory_items cascade;

drop table if exists retrieval_events cascade;
drop table if exists message_attachments cascade;
drop table if exists document_chunk_sources cascade;
drop table if exists document_chunks cascade;
drop table if exists document_acl cascade;
drop table if exists knowledge_hub_items cascade;
drop table if exists documents cascade;
drop table if exists knowledge_hubs cascade;
drop table if exists vault_folders cascade;

drop table if exists background_jobs cascade;
drop table if exists support_handoff_notifications cascade;
drop table if exists support_handoffs cascade;
drop table if exists agent_invocations cascade;
drop table if exists message_mentions cascade;
drop table if exists conversation_user_state cascade;
drop table if exists messages cascade;
drop table if exists conversation_invitations cascade;
drop table if exists conversation_members cascade;
drop table if exists conversations cascade;

drop table if exists job_invitations cascade;
drop table if exists job_members cascade;
drop table if exists jobs cascade;
drop table if exists project_members cascade;
drop table if exists projects cascade;

drop table if exists agent_invitations cascade;
drop table if exists agent_members cascade;
drop table if exists agent_versions cascade;
drop table if exists agents cascade;

drop table if exists subject_permission_grants cascade;
drop table if exists group_roles cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists member_roles cascade;
drop table if exists role_permissions cascade;
drop table if exists roles cascade;
drop table if exists permissions cascade;

drop table if exists organization_invitations cascade;
drop table if exists organization_members cascade;
drop table if exists organizations cascade;
drop table if exists profiles cascade;

-- Enums: drop in reverse declaration order.

drop type if exists agent_member_access;
drop type if exists background_job_status;
drop type if exists customer_job_status;
drop type if exists project_member_role;
drop type if exists project_status;
drop type if exists task_checklist_item_status;
drop type if exists task_status;
drop type if exists tool_risk_level;
drop type if exists invocation_status;
drop type if exists vault_resource_status;
drop type if exists document_status;
drop type if exists document_scope;
drop type if exists agent_version_status;
drop type if exists agent_status;
drop type if exists conversation_priority;
drop type if exists conversation_status;
drop type if exists sender_type;
drop type if exists access_level;
drop type if exists subject_type;
drop type if exists invitation_status;
drop type if exists member_status;
drop type if exists member_type;
