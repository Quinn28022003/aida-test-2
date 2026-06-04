-- AIDA-MVP-048: project_agents join table, active-version immutability, auto version numbering, default domain agent seed.

create table project_agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  visibility text not null default 'restricted',
  created_at timestamptz not null default now(),
  unique (project_id, agent_id)
);

comment on table project_agents is
  'Links agents to projects with per-project visibility. Agents are org-scoped; project membership is modelled here.';

insert into project_agents (org_id, project_id, agent_id, visibility)
select org_id, project_id, id, visibility
from agents;

alter table agents drop column project_id;
alter table agents drop column visibility;

alter table agent_versions drop column project_id;
alter table agent_members drop column project_id;
alter table agent_invitations drop column project_id;

drop index if exists agents_project_status_idx;
create index agents_org_status_idx on agents(org_id, status);

drop index if exists agent_members_subject_idx;
create index agent_members_subject_idx
  on agent_members(org_id, subject_type, subject_id);

create index project_agents_project_idx on project_agents(project_id);
create index project_agents_agent_idx on project_agents(agent_id);
create index project_agents_org_project_idx on project_agents(org_id, project_id);

create or replace function prevent_active_agent_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from agents
    where active_version_id = old.id
  ) then
    raise exception 'Cannot modify or delete the active agent version';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function prevent_active_agent_version_mutation() is
  'Blocks update/delete on agent_versions rows referenced by agents.active_version_id. New config is a new version row plus active_version_id update.';

create trigger agent_versions_prevent_active_mutation_on_update
  before update on agent_versions
  for each row
  execute function prevent_active_agent_version_mutation();

create trigger agent_versions_prevent_active_mutation_on_delete
  before delete on agent_versions
  for each row
  execute function prevent_active_agent_version_mutation();

create or replace function set_agent_version_number()
returns trigger
language plpgsql
as $$
declare
  next_version integer;
begin
  perform 1 from agents where id = new.agent_id for update;

  select coalesce(max(v.version), 0) + 1
  into next_version
  from agent_versions v
  where v.agent_id = new.agent_id;

  new.version := next_version;
  return new;
end;
$$;

comment on function set_agent_version_number() is
  'Assigns agent_versions.version as max(agent_id) + 1 on every insert. Client-supplied version values are ignored.';

create trigger agent_versions_set_version_before_insert
  before insert on agent_versions
  for each row
  execute function set_agent_version_number();

alter table agent_versions
  alter column version set default 0;

comment on column agent_versions.version is
  'Per-agent monotonic version. DEFAULT 0 is a placeholder for inserts that omit version; BEFORE INSERT trigger set_agent_version_number() assigns max(agent_id)+1 and overrides any supplied value.';

create or replace function ensure_default_domain_agent_for_project(p_project_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_project record;
  v_agent_id uuid;
  v_version_id uuid;
begin
  select id, org_id
  into v_project
  from projects
  where id = p_project_id
  limit 1;

  if not found then
    return null;
  end if;

  select id
  into v_agent_id
  from agents
  where org_id = v_project.org_id
    and key = 'default-assistant';

  if v_agent_id is null then
    insert into agents (org_id, key, name, description, status)
    values (
      v_project.org_id,
      'default-assistant',
      'Default Assistant',
      'Default domain agent for project conversations.',
      'active'
    )
    returning id into v_agent_id;
  end if;

  insert into project_agents (org_id, project_id, agent_id, visibility)
  values (v_project.org_id, v_project.id, v_agent_id, 'restricted')
  on conflict (project_id, agent_id) do nothing;

  select id
  into v_version_id
  from agent_versions
  where agent_id = v_agent_id
    and version = 1;

  if v_version_id is null then
    insert into agent_versions (
      org_id,
      agent_id,
      status,
      instructions,
      model_provider,
      model_name,
      model_profile,
      response_policy,
      memory_policy,
      rag_policy,
      tool_policy
    )
    values (
      v_project.org_id,
      v_agent_id,
      'active',
      'You are a helpful assistant for this project. Answer clearly and concisely using Australian English.',
      'bedrock',
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'balanced',
      '{"format":"markdown","includeCitations":true}'::jsonb,
      '{"scope":"conversation","retentionDays":30}'::jsonb,
      '{"enabled":true,"maxChunks":8,"minScore":0.7}'::jsonb,
      '{"mode":"allowlist","tools":[]}'::jsonb
    )
    returning id into v_version_id;
  end if;

  update agents
  set active_version_id = coalesce(active_version_id, v_version_id),
      status = 'active'
  where id = v_agent_id;

  return v_agent_id;
end;
$$;

comment on function ensure_default_domain_agent_for_project(uuid) is
  'Ensures each project has the default restricted domain agent linked with an active immutable version.';

create or replace function ensure_default_domain_agent_for_new_project()
returns trigger
language plpgsql
as $$
begin
  perform ensure_default_domain_agent_for_project(new.id);
  return new;
end;
$$;

create trigger projects_ensure_default_domain_agent_after_insert
  after insert on projects
  for each row
  execute function ensure_default_domain_agent_for_new_project();

-- Idempotent default domain agent for existing projects.
do $$
declare
  v_project record;
begin
  for v_project in
    select id
    from projects
    order by created_at asc
  loop
    perform ensure_default_domain_agent_for_project(v_project.id);
  end loop;
end $$;
