/**
 * SECURITY DEFINER helpers emitted in dependency-safe order:
 * identity → tenant → project/job → conversation → document → agent.
 */

import { createFunction, dropFunction } from './sql-primitives.mjs';

const currentProfileIdFunc = {
  name: 'current_profile_id',
  args: '',
  returns: 'uuid',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return (
    select id from profiles where auth_user_id = auth.uid()
  );
end;`,
};

const currentProfileFunc = {
  name: 'current_profile',
  args: '',
  returns: 'profiles',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_profile profiles;
begin
  select * into v_profile
  from profiles
  where auth_user_id = auth.uid();

  return v_profile;
end;`,
};

const isActiveInternalMemberFunc = {
  name: 'is_active_internal_member',
  args: 'p_org_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from organization_members
    where org_id = p_org_id
      and user_id = current_profile_id()
      and member_type = 'internal'
      and status = 'active'
  );
end;`,
};

const isOrgMemberFunc = {
  name: 'is_org_member',
  args: 'p_org_id uuid, p_member_type text default null',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from organization_members
    where org_id = p_org_id
      and user_id = current_profile_id()
      and status = 'active'
      and (p_member_type is null or member_type = p_member_type)
  );
end;`,
};

const hasOrgPermissionFunc = {
  name: 'has_org_permission',
  args: 'p_org_id uuid, p_permission_key text',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  -- Direct role assignment
  if exists (
    select 1 from member_roles mr
    join role_permissions rp on rp.role_id = mr.role_id
    where mr.org_id = p_org_id
      and mr.user_id = current_profile_id()
      and rp.permission_key = p_permission_key
  ) then
    return true;
  end if;

  -- Group role assignment
  if exists (
    select 1 from group_members gm
    join group_roles gr on gr.group_id = gm.group_id
    join role_permissions rp on rp.role_id = gr.role_id
    where gm.org_id = p_org_id
      and gm.user_id = current_profile_id()
      and rp.permission_key = p_permission_key
  ) then
    return true;
  end if;

  -- Direct permission grant
  if exists (
    select 1 from subject_permission_grants
    where org_id = p_org_id
      and subject_type = 'user'
      and subject_id = current_profile_id()
      and permission_key = p_permission_key
      and (expires_at is null or expires_at > now())
  ) then
    return true;
  end if;

  -- Group permission grant
  if exists (
    select 1 from subject_permission_grants spg
    join group_members gm on gm.group_id = spg.subject_id
    where spg.org_id = p_org_id
      and spg.subject_type = 'group'
      and gm.user_id = current_profile_id()
      and spg.permission_key = p_permission_key
      and (spg.expires_at is null or spg.expires_at > now())
  ) then
    return true;
  end if;

  return false;
end;`,
};

const isOrgOwnerFunc = {
  name: 'is_org_owner',
  args: 'p_org_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return is_active_internal_member(p_org_id)
    and exists (
      select 1 from member_roles mr
      join roles r on r.id = mr.role_id
      where mr.org_id = p_org_id
        and mr.user_id = current_profile_id()
        and r.key = 'owner'
        and (r.org_id is null or r.org_id = p_org_id)
    );
end;`,
};

const isProjectMemberFunc = {
  name: 'is_project_member',
  args: 'p_project_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from project_members pm
    join projects p on p.id = pm.project_id and p.org_id = pm.org_id
    where pm.project_id = p_project_id
      and pm.user_id = current_profile_id()
      and p.status = 'active'
  );
end;`,
};

const isJobMemberFunc = {
  name: 'is_job_member',
  args: 'p_job_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from job_members jm
    join jobs j on j.id = jm.job_id and j.org_id = jm.org_id and j.project_id = jm.project_id
    where jm.job_id = p_job_id
      and jm.user_id = current_profile_id()
      and j.status <> 'archived'
  );
end;`,
};

const isInternalJobMemberFunc = {
  name: 'is_internal_job_member',
  args: 'p_job_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from job_members jm
    join jobs j on j.id = jm.job_id and j.org_id = jm.org_id and j.project_id = jm.project_id
    where jm.job_id = p_job_id
      and jm.user_id = current_profile_id()
      and jm.member_kind = 'internal'
      and j.status <> 'archived'
  );
end;`,
};

const isCustomerJobMemberFunc = {
  name: 'is_customer_job_member',
  args: 'p_job_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from job_members jm
    join jobs j on j.id = jm.job_id and j.org_id = jm.org_id and j.project_id = jm.project_id
    where jm.job_id = p_job_id
      and jm.user_id = current_profile_id()
      and jm.member_kind = 'customer'
      and j.status = 'open'
  );
end;`,
};

const isConversationMemberFunc = {
  name: 'is_conversation_member',
  args: 'p_conversation_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return exists (
    select 1 from conversation_members
    where conversation_id = p_conversation_id
      and subject_type = 'user'
      and subject_id = current_profile_id()
  );
end;`,
};

const canEditConversationFunc = {
  name: 'can_edit_conversation',
  args: 'p_conversation_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  if exists (
    select 1 from conversation_members
    where conversation_id = p_conversation_id
      and subject_type = 'user'
      and subject_id = current_profile_id()
      and access_level = 'editor'
  ) then
    return true;
  end if;

  return exists (
    select 1 from conversations c
    where c.id = p_conversation_id
      and c.created_by = current_profile_id()
      and is_customer_job_member(c.job_id)
  );
end;`,
};

const canAccessConversationFunc = {
  name: 'can_access_conversation',
  args: 'p_conversation_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_org_id uuid;
  v_project_id uuid;
  v_job_id uuid;
  v_created_by uuid;
  v_job_status customer_job_status;
begin
  select c.org_id, c.project_id, c.job_id, c.created_by, j.status
  into v_org_id, v_project_id, v_job_id, v_created_by, v_job_status
  from conversations c
  join jobs j on j.id = c.job_id and j.org_id = c.org_id and j.project_id = c.project_id
  where c.id = p_conversation_id;

  if v_org_id is null then
    return false;
  end if;

  if v_job_status = 'archived' then
    return false;
  end if;

  if is_conversation_member(p_conversation_id) then
    return true;
  end if;

  if v_created_by = current_profile_id()
    and (
      is_internal_job_member(v_job_id)
      or (is_active_internal_member(v_org_id) and is_project_member(v_project_id))
    ) then
    return true;
  end if;

  if is_internal_job_member(v_job_id) then
    return true;
  end if;

  if is_customer_job_member(v_job_id) and v_created_by = current_profile_id() then
    return true;
  end if;

  if is_active_internal_member(v_org_id) and is_project_member(v_project_id) then
    return true;
  end if;

  return false;
end;`,
};

const canAccessDocumentFunc = {
  name: 'can_access_document',
  args: 'p_document_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_scope document_scope;
  v_owner_id uuid;
  v_conversation_id uuid;
  v_org_id uuid;
  v_project_id uuid;
  v_job_id uuid;
begin
  select scope, owner_id, conversation_id, org_id, project_id, job_id
  into v_scope, v_owner_id, v_conversation_id, v_org_id, v_project_id, v_job_id
  from documents
  where id = p_document_id
    and status <> 'deleted'
    and deleted_at is null;

  if v_scope is null then
    return false;
  end if;

  if v_scope = 'private' then
    return v_conversation_id is null
      and v_owner_id = current_profile_id()
      and is_active_internal_member(v_org_id);
  end if;

  if v_scope = 'conversation' then
    return v_conversation_id is not null
      and exists (
        select 1 from conversations c
        where c.id = v_conversation_id
          and c.org_id = v_org_id
          and c.project_id = v_project_id
          and c.job_id = v_job_id
      )
      and can_access_conversation(v_conversation_id)
      and (
        is_conversation_member(v_conversation_id)
        or is_job_member(coalesce(v_job_id, (select job_id from conversations where id = v_conversation_id)))
      );
  end if;

  if v_scope = 'org' then
    return v_conversation_id is null
      and is_active_internal_member(v_org_id);
  end if;

  return false;
end;`,
};

const canUploadDocumentFunc = {
  name: 'can_upload_document',
  args:
    'p_org_id uuid, p_scope document_scope, p_owner_id uuid, p_conversation_id uuid, p_project_id uuid, p_job_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_job_id uuid;
  v_project_id uuid;
  v_conv_org_id uuid;
begin
  if current_profile_id() is null then
    return false;
  end if;

  if p_owner_id is distinct from current_profile_id() then
    return false;
  end if;

  if p_scope = 'private' then
    return p_conversation_id is null
      and is_active_internal_member(p_org_id);
  end if;

  if p_scope = 'conversation' then
    select c.job_id, c.project_id, c.org_id
    into v_job_id, v_project_id, v_conv_org_id
    from conversations c
    where c.id = p_conversation_id;

    if v_job_id is null or v_conv_org_id is distinct from p_org_id then
      return false;
    end if;

    if p_project_id is distinct from v_project_id or p_job_id is distinct from v_job_id then
      return false;
    end if;

    return can_edit_conversation(p_conversation_id)
      and (
        is_job_member(v_job_id)
        or (is_active_internal_member(p_org_id) and is_project_member(v_project_id))
      );
  end if;

  if p_scope = 'org' then
    return p_conversation_id is null
      and is_active_internal_member(p_org_id);
  end if;

  return false;
end;`,
};

const hasAgentMemberAccessFunc = {
  name: 'has_agent_member_access',
  args: 'p_agent_id uuid, p_required_access agent_member_access[]',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_org_id uuid;
  v_profile_id uuid;
begin
  v_profile_id := current_profile_id();

  select org_id into v_org_id
  from agents
  where id = p_agent_id
    and status = 'active';

  if v_org_id is null then
    return false;
  end if;

  if exists (
    select 1 from agent_members
    where agent_id = p_agent_id
      and org_id = v_org_id
      and subject_type = 'user'
      and subject_id = v_profile_id
      and access = any(p_required_access)
      and revoked_at is null
  ) then
    return true;
  end if;

  if exists (
    select 1 from agent_members am
    join group_members gm on gm.group_id = am.subject_id and gm.org_id = am.org_id
    where am.agent_id = p_agent_id
      and am.org_id = v_org_id
      and am.subject_type = 'group'
      and gm.user_id = v_profile_id
      and am.access = any(p_required_access)
      and am.revoked_at is null
  ) then
    return true;
  end if;

  if exists (
    select 1 from agent_members am
    join member_roles mr on mr.role_id = am.subject_id and mr.org_id = am.org_id
    where am.agent_id = p_agent_id
      and am.org_id = v_org_id
      and am.subject_type = 'role'
      and mr.user_id = v_profile_id
      and am.access = any(p_required_access)
      and am.revoked_at is null
  ) then
    return true;
  end if;

  return false;
end;`,
};

const canStartConversationWithAgentFunc = {
  name: 'can_start_conversation_with_agent',
  args: 'p_agent_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `begin
  return has_agent_member_access(p_agent_id, array['invoker', 'manager']::agent_member_access[]);
end;`,
};

const canInvokeAgentInConversationFunc = {
  name: 'can_invoke_agent_in_conversation',
  args: 'p_agent_id uuid, p_conversation_id uuid',
  returns: 'boolean',
  securityDefiner: true,
  stable: true,
  searchPath: 'public, auth',
  body: `declare
  v_org_id uuid;
begin
  if p_conversation_id is null then
    return false;
  end if;

  if not can_access_conversation(p_conversation_id) then
    return false;
  end if;

  select org_id into v_org_id
  from agents
  where id = p_agent_id
    and status = 'active';

  if v_org_id is null then
    return false;
  end if;

  if not exists (
    select 1 from conversations
    where id = p_conversation_id
      and org_id = v_org_id
  ) then
    return false;
  end if;

  if exists (
    select 1 from conversation_members
    where conversation_id = p_conversation_id
      and subject_type = 'agent'
      and subject_id = p_agent_id
  ) then
    return true;
  end if;

  return has_agent_member_access(p_agent_id, array['invoker', 'manager']::agent_member_access[]);
end;`,
};

const helperFunctions = [
  currentProfileIdFunc,
  currentProfileFunc,
  isActiveInternalMemberFunc,
  isOrgMemberFunc,
  hasOrgPermissionFunc,
  isOrgOwnerFunc,
  isProjectMemberFunc,
  isJobMemberFunc,
  isInternalJobMemberFunc,
  isCustomerJobMemberFunc,
  isConversationMemberFunc,
  canEditConversationFunc,
  canAccessConversationFunc,
  canAccessDocumentFunc,
  canUploadDocumentFunc,
  hasAgentMemberAccessFunc,
  canStartConversationWithAgentFunc,
  canInvokeAgentInConversationFunc,
];

export function generateDropFunctions() {
  return [
    dropFunction('can_invoke_agent_in_conversation', 'uuid, uuid'),
    dropFunction('can_start_conversation_with_agent', 'uuid'),
    dropFunction('has_agent_member_access', 'uuid, agent_member_access[]'),
    dropFunction('can_invoke_agent', 'uuid, uuid'),
    dropFunction('can_invoke_agent', 'uuid'),
    dropFunction('can_upload_document', 'uuid, document_scope, uuid, uuid, uuid, uuid'),
    dropFunction('can_upload_document', 'uuid, document_scope, uuid, uuid'),
    dropFunction('can_upload_document', 'document_scope, uuid, uuid'),
    dropFunction('can_access_document', 'uuid'),
    dropFunction('can_access_conversation', 'uuid'),
    dropFunction('can_edit_conversation', 'uuid'),
    dropFunction('is_conversation_member', 'uuid'),
    dropFunction('is_customer_job_member', 'uuid'),
    dropFunction('is_internal_job_member', 'uuid'),
    dropFunction('is_job_member', 'uuid'),
    dropFunction('is_project_member', 'uuid'),
    dropFunction('is_org_owner', 'uuid'),
    dropFunction('has_org_permission', 'uuid, text'),
    dropFunction('is_org_member', 'uuid, text'),
    dropFunction('is_org_member', 'uuid'),
    dropFunction('is_active_internal_member', 'uuid'),
    dropFunction('current_profile', ''),
    dropFunction('current_profile_id', ''),
  ];
}

export function generateCreateFunctions() {
  return helperFunctions.map((fn) => createFunction(fn));
}
