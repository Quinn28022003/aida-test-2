-- AIDA-MVP-048 agent/project join table rollback (local only)
--
-- Use only against a local or disposable Supabase database. Production rollback
-- is forward-fix only because the matching up migration drops columns, moves
-- agent/project scope into project_agents, and seeds default project links.
--
-- This restores the previous single-project agent shape for local recovery.
-- If an agent has multiple project_agents rows, the oldest link is used for
-- agents.project_id and agents.visibility because the old schema could store
-- only one project per agent.

drop trigger if exists projects_ensure_default_domain_agent_after_insert on projects;
drop function if exists ensure_default_domain_agent_for_new_project();
drop function if exists ensure_default_domain_agent_for_project(uuid);

drop trigger if exists agent_versions_set_version_before_insert on agent_versions;
drop function if exists set_agent_version_number();

drop trigger if exists agent_versions_prevent_active_mutation_on_update on agent_versions;
drop trigger if exists agent_versions_prevent_active_mutation_on_delete on agent_versions;
drop function if exists prevent_active_agent_version_mutation();

alter table agent_versions
  alter column version drop default;

alter table agents
  add column project_id uuid references projects(id) on delete cascade,
  add column visibility text not null default 'restricted';

alter table agent_versions
  add column project_id uuid references projects(id) on delete cascade;

alter table agent_members
  add column project_id uuid references projects(id) on delete cascade;

alter table agent_invitations
  add column project_id uuid references projects(id) on delete cascade;

update agents a
set
  project_id = link.project_id,
  visibility = coalesce(link.visibility, 'restricted')
from (
  select distinct on (agent_id)
    agent_id,
    project_id,
    visibility
  from project_agents
  order by agent_id, created_at asc, id asc
) link
where link.agent_id = a.id;

update agent_versions av
set project_id = a.project_id
from agents a
where a.id = av.agent_id;

update agent_members am
set project_id = a.project_id
from agents a
where a.id = am.agent_id;

update agent_invitations ai
set project_id = a.project_id
from agents a
where a.id = ai.agent_id;

alter table agents
  alter column project_id set not null;

alter table agent_versions
  alter column project_id set not null;

alter table agent_members
  alter column project_id set not null;

alter table agent_invitations
  alter column project_id set not null;

drop index if exists agents_org_status_idx;
drop index if exists agent_members_subject_idx;
drop index if exists project_agents_project_idx;
drop index if exists project_agents_agent_idx;
drop index if exists project_agents_org_project_idx;

create index agents_project_status_idx on agents(project_id, status);
create index agent_members_subject_idx
  on agent_members(org_id, project_id, subject_type, subject_id);

drop table if exists project_agents;
