/**
 * RLS policies and table setup from `TABLE_RLS_POLICY_CONFIG`.
 * Policy expressions are grouped by domain in source order for readability.
 */

import {
  alterTableRls,
  createPolicy,
  dropPolicy,
  forceRls,
  grantTable,
  revokeTable,
} from './sql-primitives.mjs';

const ACTION_TO_COMMAND = {
  select: 'SELECT',
  insert: 'INSERT',
  update: 'UPDATE',
  delete: 'DELETE',
};

function policyName(table, action) {
  return `${table}_${action}_access`;
}

/** Qualify policy-row columns so subqueries joining parent tables stay unambiguous. */
function rowCol(tableName, column) {
  return `${tableName}.${column}`;
}

/** @param {object} authz - loaded `@aida/contracts` authz module (post-build dist) */
export function createPolicySqlGenerators(authz) {
  const { ERlsCheckType, TABLE_RLS_POLICY_CONFIG, TABLES } = authz;

  const tenantRlsTables = TABLE_RLS_POLICY_CONFIG.filter((entry) => entry.classification !== 'reference').map(
    (entry) => entry.table,
  );
  const referenceRlsTables = TABLE_RLS_POLICY_CONFIG.filter((entry) => entry.classification === 'reference').map(
    (entry) => entry.table,
  );
  const rlsTables = [...tenantRlsTables, ...referenceRlsTables];

  // -------------------------------------------------------------------------
  // Domain: org / RBAC (tenant + permission checks)
  // -------------------------------------------------------------------------

  function orgPermissionExpr(table, permissionKey, action) {
    if (table === TABLES.ORGANIZATIONS) {
      if (action === 'insert') {
        return 'created_by = current_profile_id()';
      }
      if (action === 'select') {
        return `(is_active_internal_member(id) and has_org_permission(id, '${permissionKey}'))
    or created_by = current_profile_id()`;
      }
      return `is_active_internal_member(id) and has_org_permission(id, '${permissionKey}')`;
    }
    if (table === TABLES.ORGANIZATION_MEMBERS && (action === 'select' || action === 'insert')) {
      return `(is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}'))
    or (
      user_id = current_profile_id()
      and member_type = 'internal'
      and status = 'active'
      and exists (
        select 1 from organizations o
        where o.id = organization_members.org_id
          and o.created_by = current_profile_id()
      )
    )`;
    }
    if (table === TABLES.MEMBER_ROLES && (action === 'select' || action === 'insert')) {
      return `(is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}'))
    or (
      user_id = current_profile_id()
      and assigned_by = current_profile_id()
      and exists (
        select 1 from organizations o
        where o.id = member_roles.org_id
          and o.created_by = current_profile_id()
      )
      and exists (
        select 1 from roles r
        where r.id = member_roles.role_id
          and r.org_id is null
          and r.key = 'owner'
      )
    )`;
    }
    if (table === TABLES.ROLES) {
      if (action === 'select') {
        return `(org_id is null and auth.uid() is not null) or (org_id is not null and is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}'))`;
      }
      return `org_id is not null and is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
    }
    if (table === TABLES.ROLE_PERMISSIONS) {
      if (action === 'select') {
        return `exists (
      select 1 from roles r
      where r.id = role_id
        and (
          (r.org_id is null and auth.uid() is not null)
          or (
            r.org_id is not null
            and is_active_internal_member(r.org_id)
            and has_org_permission(r.org_id, '${permissionKey}')
          )
        )
    )`;
      }
      return `exists (
      select 1 from roles r
      where r.id = role_id
        and r.org_id is not null
        and is_active_internal_member(r.org_id)
        and has_org_permission(r.org_id, '${permissionKey}')
    )`;
    }
    return `is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
  }

  function profileExpr(permissionKey, action) {
    if (action === 'select') {
      return `auth_user_id = auth.uid() or exists (
      select 1 from organization_members om1
      join organization_members om2 on om1.org_id = om2.org_id
      where om1.user_id = profiles.id
        and om2.user_id = current_profile_id()
        and om2.member_type = 'internal'
        and om2.status = 'active'
        and has_org_permission(om2.org_id, '${permissionKey}')
    )`;
    }
    return 'auth_user_id = auth.uid()';
  }

  // -------------------------------------------------------------------------
  // Domain: conversations, messages, attachments (conversation access + org match)
  // -------------------------------------------------------------------------
  // Note: there is no messages.internal_only — baseline policies cannot hide rows
  // from some conversation members; see ../generate-rls-sql.mjs header and docs/auth-rbac.md.

  function conversationInvitationExpr(permissionKey, action) {
    const managerPath = `can_access_conversation(conversation_id) and has_org_permission(org_id, '${permissionKey}')`;
    const inviteeEmailMatch = `lower(email) = lower((select p.email from profiles p where p.id = current_profile_id()))`;
    const inviteePending = `${inviteeEmailMatch} and status = 'pending' and expires_at > now() and revoked_at is null`;

    if (action === 'select') {
      return `(${managerPath}) or (${inviteePending})`;
    }
    if (action === 'insert' || action === 'delete') {
      return managerPath;
    }
    if (action === 'update') {
      const inviteeAcceptWithCheck = `${inviteeEmailMatch} and status = 'accepted' and accepted_by = current_profile_id() and revoked_at is null`;
      return {
        using: `(${managerPath}) or (${inviteePending})`,
        withCheck: `(${managerPath}) or (${inviteeAcceptWithCheck})`,
      };
    }
    return null;
  }

  const TABLES_WITH_CONVERSATION_JOB_SCOPE = new Set([
    TABLES.MESSAGES,
    TABLES.MESSAGE_MENTIONS,
    TABLES.CONVERSATION_MEMBERS,
    TABLES.CONVERSATION_USER_STATE,
    TABLES.CONVERSATION_INVITATIONS,
  ]);

  /** Row tenant columns must match the parent conversation (blocks mismatched child rows). */
  function conversationParentMatch(tableName) {
    const jobProjectMatch = TABLES_WITH_CONVERSATION_JOB_SCOPE.has(tableName)
      ? `
        and c.project_id = ${tableName}.project_id
        and c.job_id = ${tableName}.job_id`
      : '';
    return `exists (
      select 1 from conversations c
      where c.id = ${tableName}.conversation_id
        and c.org_id = ${tableName}.org_id${jobProjectMatch}
    )`;
  }

  function messageOrgMatch(tableName) {
    return `exists (
      select 1 from messages m
      where m.id = ${tableName}.message_id
        and m.conversation_id = ${tableName}.conversation_id
        and m.org_id = ${tableName}.org_id
    )`;
  }

  /**
   * Single EXISTS: conversation row org matches row org_id, then read via internal RBAC on
   * that conversation org OR direct conversation membership. Avoids `(exists and X) or Y`
   * ambiguity and rejects mismatched-org child rows (no matching `c` row).
   * Always qualify columns with `tableName` — joins make bare `conversation_id` ambiguous.
   */
  function conversationAlignedReadExpr(_permissionKey, tableName) {
    const jobProjectMatch = TABLES_WITH_CONVERSATION_JOB_SCOPE.has(tableName)
      ? `
        and c.project_id = ${tableName}.project_id
        and c.job_id = ${tableName}.job_id`
      : '';
    return `exists (
      select 1 from conversations c
      where c.id = ${tableName}.conversation_id
        and c.org_id = ${tableName}.org_id${jobProjectMatch}
        and can_access_conversation(c.id)
    )`;
  }

  function conversationReadExpr(_permissionKey, conversationIdColumn = 'conversation_id') {
    return `can_access_conversation(${conversationIdColumn})`;
  }

  function internalConversationWriteExpr(permissionKey) {
    return `is_active_internal_member(org_id)
    and has_org_permission(org_id, '${permissionKey}')`;
  }

  function editorConversationWriteExpr(permissionKey, conversationIdColumn = 'conversation_id') {
    return `((${internalConversationWriteExpr(permissionKey)})
    or can_edit_conversation(${conversationIdColumn}))`;
  }

  function conversationExpr(table, permissionKey, action) {
    if (table === TABLES.CONVERSATION_INVITATIONS) {
      return conversationInvitationExpr(permissionKey, action);
    }
    if (table === TABLES.CONVERSATIONS) {
      if (action === 'insert') {
        return `(
      is_active_internal_member(org_id)
      and is_project_member(project_id)
      and has_org_permission(org_id, '${permissionKey}')
    )
    or (
      is_customer_job_member(job_id)
      and created_by = current_profile_id()
      and exists (
        select 1 from jobs j
        where j.id = job_id
          and j.org_id = org_id
          and j.project_id = project_id
      )
    )`;
      }
      if (action === 'select') {
        return conversationReadExpr(permissionKey, 'id');
      }
      return `is_active_internal_member(org_id)
    and is_project_member(project_id)
    and (${internalConversationWriteExpr(permissionKey)})`;
    }

    if (table === TABLES.MESSAGES && action === 'select') {
      return conversationAlignedReadExpr(permissionKey, table);
    }

    if (table === TABLES.MESSAGE_MENTIONS && action === 'select') {
      return `(${conversationAlignedReadExpr(permissionKey, table)})
    and (${messageOrgMatch(table)})`;
    }

    if (table === TABLES.CONVERSATION_USER_STATE && action === 'select') {
      return conversationAlignedReadExpr(permissionKey, table);
    }

    if (table === TABLES.MESSAGE_ATTACHMENTS) {
      const attachmentParentsMatch = `${conversationParentMatch(table)}
    and ${messageOrgMatch(table)}
    and exists (
      select 1 from documents d
      where d.id = ${table}.document_id
        and d.org_id = ${table}.org_id
        and d.scope = 'conversation'
        and d.conversation_id = ${table}.conversation_id
    )`;

      if (action === 'select') {
        return `exists (
      select 1
      from conversations c
      join messages m on m.id = ${table}.message_id
      join documents d on d.id = ${table}.document_id
      where c.id = ${table}.conversation_id
        and c.org_id = ${table}.org_id
        and m.conversation_id = c.id
        and m.org_id = c.org_id
        and d.org_id = c.org_id
        and can_access_conversation(c.id)
    )
    and can_access_document(${table}.document_id)`;
      }

      return `(${attachmentParentsMatch})
    and can_access_document(document_id)
    and (${editorConversationWriteExpr(permissionKey)})`;
    }

    if (table === TABLES.MESSAGES && action === 'insert') {
      return `(${conversationParentMatch(table)})
    and (
      (${internalConversationWriteExpr(permissionKey)})
      or (
        can_edit_conversation(conversation_id)
        and sender_type = 'user'
        and sender_id = current_profile_id()
      )
    )`;
    }

    if (table === TABLES.MESSAGE_MENTIONS && action === 'insert') {
      return `${conversationParentMatch(table)}
    and ${messageOrgMatch(table)}
    and ${editorConversationWriteExpr(permissionKey)}`;
    }

    if (table === TABLES.CONVERSATION_MEMBERS && action !== 'select') {
      return `${conversationParentMatch(table)}
    and is_org_owner(org_id)`;
    }

    const parentsMatch =
      table === TABLES.MESSAGE_MENTIONS
        ? `${conversationParentMatch(table)}
    and ${messageOrgMatch(table)}`
        : conversationParentMatch(table);

    if (action === 'select') {
      return `(${parentsMatch})
    and (${conversationReadExpr(permissionKey)})`;
    }

    return `(${parentsMatch})
    and (${internalConversationWriteExpr(permissionKey)})`;
  }

  // -------------------------------------------------------------------------
  // Domain: documents & chunk tables (RAG — always gate chunks via can_access_document)
  // -------------------------------------------------------------------------

  function documentOrgReadExpr(permissionKey, documentAlias = '') {
    const prefix = documentAlias ? `${documentAlias}.` : '';
    return `(${prefix}scope in ('conversation', 'private'))
    or (${prefix}scope = 'org' and has_org_permission(${prefix}org_id, '${permissionKey}'))`;
  }

  function documentParentMatch(tableName, documentIdColumn = 'document_id') {
    return `exists (
      select 1 from documents d
      where d.id = ${rowCol(tableName, documentIdColumn)}
        and d.org_id = ${rowCol(tableName, 'org_id')}
    )`;
  }

  function documentExpr(table, permissionKey, action) {
    if (table === TABLES.DOCUMENT_ACL) {
      if (action === 'select') {
        return `exists (
      select 1 from documents d
      where d.id = ${rowCol(table, 'document_id')}
        and d.org_id = ${rowCol(table, 'org_id')}
        and can_access_document(d.id)
    )`;
      }
      return `exists (
      select 1 from documents d
      where d.id = ${rowCol(table, 'document_id')}
        and d.org_id = ${rowCol(table, 'org_id')}
    )
    and is_active_internal_member(${rowCol(table, 'org_id')})
    and has_org_permission(${rowCol(table, 'org_id')}, '${permissionKey}')`;
    }

    if (table === TABLES.DOCUMENTS) {
      if (action === 'insert') {
        return `can_upload_document(org_id, scope, owner_id, conversation_id, project_id, job_id)
    and (
      scope = 'conversation'
      or has_org_permission(org_id, '${permissionKey}')
    )`;
      }
      if (action === 'select') {
        return `can_access_document(id)
    and (${documentOrgReadExpr(permissionKey)})`;
      }
      return `can_access_document(id)
    and has_org_permission(org_id, '${permissionKey}')`;
    }
    if (table === TABLES.DOCUMENT_CHUNK_SOURCES) {
      if (action === 'select') {
        return `exists (
      select 1 from document_chunks dc
      join documents d on d.id = dc.document_id
      where dc.id = ${rowCol(table, 'chunk_id')}
        and dc.org_id = ${rowCol(table, 'org_id')}
        and d.org_id = ${rowCol(table, 'org_id')}
        and dc.deleted_at is null
        and can_access_document(dc.document_id)
        and (${documentOrgReadExpr(permissionKey, 'd')})
    )`;
      }
      return `exists (
      select 1 from document_chunks dc
      join documents d on d.id = dc.document_id
      where dc.id = ${rowCol(table, 'chunk_id')}
        and dc.org_id = ${rowCol(table, 'org_id')}
        and d.org_id = ${rowCol(table, 'org_id')}
    )
    and is_active_internal_member(${rowCol(table, 'org_id')})
    and has_org_permission(${rowCol(table, 'org_id')}, '${permissionKey}')`;
    }
    if (table === TABLES.RETRIEVAL_EVENTS) {
      return `is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
    }
    if (action === 'select') {
      return `${documentParentMatch(table, 'document_id')}
    and ${rowCol(table, 'deleted_at')} is null
    and can_access_document(${rowCol(table, 'document_id')})
    and exists (
      select 1 from documents d
      where d.id = ${rowCol(table, 'document_id')}
        and d.org_id = ${rowCol(table, 'org_id')}
        and (${documentOrgReadExpr(permissionKey, 'd')})
    )`;
    }
    return `${documentParentMatch(table, 'document_id')}
    and is_active_internal_member(${rowCol(table, 'org_id')})
    and has_org_permission(${rowCol(table, 'org_id')}, '${permissionKey}')`;
  }

  // -------------------------------------------------------------------------
  // Domain: agent invocation (requires can_invoke_agent where inserts apply)
  // -------------------------------------------------------------------------

  function jobInvitationExpr(permissionKey, action) {
    const managerPath = `(is_project_member(project_id) or is_internal_job_member(job_id))
    and has_org_permission(org_id, '${permissionKey}')`;
    const inviteeEmailMatch = `lower(email) = lower((select p.email from profiles p where p.id = current_profile_id()))`;
    const inviteePending = `${inviteeEmailMatch} and status = 'pending' and expires_at > now() and revoked_at is null`;

    if (action === 'select') {
      return `(${managerPath}) or (${inviteePending})`;
    }
    if (action === 'insert' || action === 'delete') {
      return managerPath;
    }
    if (action === 'update') {
      const inviteeAcceptWithCheck = `${inviteeEmailMatch} and status = 'accepted' and accepted_by = current_profile_id() and revoked_at is null`;
      return {
        using: `(${managerPath}) or (${inviteePending})`,
        withCheck: `(${managerPath}) or (${inviteeAcceptWithCheck})`,
      };
    }
    return null;
  }

  function projectJobExpr(table, permissionKey, action) {
    if (table === TABLES.JOB_INVITATIONS) {
      return jobInvitationExpr(permissionKey, action);
    }

    if (table === TABLES.PROJECTS) {
      if (action === 'select') {
        return `(is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}'))
    or is_project_member(id)`;
      }
      return `is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
    }

    if (table === TABLES.PROJECT_MEMBERS) {
      if (action === 'select') {
        return `(is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}'))
    or is_project_member(project_id)`;
      }
      return `is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
    }

    if (table === TABLES.JOBS) {
      if (action === 'select') {
        return `(is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}') and is_project_member(project_id))
    or is_job_member(id)`;
      }
      return `is_active_internal_member(org_id)
    and is_project_member(project_id)
    and has_org_permission(org_id, '${permissionKey}')`;
    }

    if (table === TABLES.JOB_MEMBERS) {
      const jobScopeMatch = `exists (
      select 1 from jobs j
      where j.id = ${table}.job_id
        and j.org_id = ${table}.org_id
        and j.project_id = ${table}.project_id
    )`;
      if (action === 'select') {
        return `(${jobScopeMatch})
    and (
      (is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}') and is_project_member(project_id))
      or is_job_member(job_id)
    )`;
      }
      return `(${jobScopeMatch})
    and is_active_internal_member(org_id)
    and is_project_member(project_id)
    and has_org_permission(org_id, '${permissionKey}')`;
    }

    return `is_active_internal_member(org_id) and has_org_permission(org_id, '${permissionKey}')`;
  }

  function agentExpr(table, permissionKey, action) {
    const orgScopedInternal = `auth.uid() is not null
    and is_active_internal_member(org_id)
    and has_org_permission(org_id, '${permissionKey}')`;
    const tenantConsistentProjectAgent = `${orgScopedInternal}
    and exists (
      select 1 from projects p
      where p.id = ${table}.project_id
        and p.org_id = ${table}.org_id
    )`;
    const tenantConsistentAgentVersion = `${orgScopedInternal}
    and exists (
      select 1 from agents a
      where a.id = ${table}.agent_id
        and a.org_id = ${table}.org_id
    )`;

    if (table === TABLES.AGENTS) {
      if (action === 'select') {
        return `(${orgScopedInternal})
    or has_agent_member_access(id, array['viewer', 'invoker', 'manager']::agent_member_access[])`;
      }
      return orgScopedInternal;
    }

    if (table === TABLES.PROJECT_AGENTS) {
      return tenantConsistentProjectAgent;
    }

    if (table === TABLES.AGENT_VERSIONS) {
      return tenantConsistentAgentVersion;
    }

    if (table === TABLES.AGENT_MEMBERS) {
      if (action === 'select') {
        return `(${orgScopedInternal})
    or has_agent_member_access(agent_id, array['viewer', 'invoker', 'manager']::agent_member_access[])`;
      }
      return orgScopedInternal;
    }

    if (table === TABLES.AGENT_INVITATIONS) {
      return orgScopedInternal;
    }

    if (table === TABLES.AGENT_INVOCATIONS) {
      const parentMatch = `exists (
      select 1 from conversations c
      where c.id = ${rowCol(table, 'conversation_id')}
        and c.org_id = ${rowCol(table, 'org_id')}
        and c.project_id = ${rowCol(table, 'project_id')}
        and c.job_id = ${rowCol(table, 'job_id')}
    )`;
      if (action === 'insert') {
        return `(${parentMatch})
    and can_invoke_agent_in_conversation(${rowCol(table, 'agent_id')}, ${rowCol(table, 'conversation_id')})
    and requested_by = current_profile_id()`;
      }
      if (action === 'select') {
        return `(${parentMatch})
    and (
      has_org_permission(${rowCol(table, 'org_id')}, '${permissionKey}')
      or can_access_conversation(${rowCol(table, 'conversation_id')})
    )`;
      }
      return `(${parentMatch})
    and can_access_conversation(${rowCol(table, 'conversation_id')})
    and has_org_permission(${rowCol(table, 'org_id')}, '${permissionKey}')`;
    }

    return orgScopedInternal;
  }

  // -------------------------------------------------------------------------
  // Domain: reference data (authenticated read, no tenant row checks)
  // -------------------------------------------------------------------------

  function referenceExpr(table) {
    if (table === TABLES.PLUGINS) {
      return "auth.uid() is not null and status = 'active'";
    }
    return 'auth.uid() is not null';
  }

  function policyExpression(entry, action, permissionKey) {
    switch (entry.checkType) {
      case ERlsCheckType.ProfileAccess:
        return profileExpr(permissionKey, action);
      case ERlsCheckType.OrgPermission:
        return orgPermissionExpr(entry.table, permissionKey, action);
      case ERlsCheckType.ProjectJobAccess:
        return projectJobExpr(entry.table, permissionKey, action);
      case ERlsCheckType.ConversationAccess:
        return conversationExpr(entry.table, permissionKey, action);
      case ERlsCheckType.DocumentAccess:
        return documentExpr(entry.table, permissionKey, action);
      case ERlsCheckType.AgentAccess:
        return agentExpr(entry.table, permissionKey, action);
      case ERlsCheckType.ReferenceRead:
        return referenceExpr(entry.table);
      case ERlsCheckType.ServiceOnly:
        return null;
      default:
        return null;
    }
  }

  function buildTablePolicies(entry) {
    const actions = ['select', 'insert', 'update', 'delete'];
    const drops = [];
    const creates = [];

    for (const action of actions) {
      const permissionKey = entry.permissions[action];
      if (!permissionKey) {
        continue;
      }

      const expr = policyExpression(entry, action, permissionKey);
      if (!expr) {
        continue;
      }

      const usingExpr = typeof expr === 'string' ? expr : expr.using;
      const withCheckExpr = typeof expr === 'string' ? expr : expr.withCheck;

      const name = policyName(entry.table, action);
      drops.push(dropPolicy(name, entry.table));

      if (action === 'select' || action === 'delete') {
        creates.push(
          createPolicy({
            name,
            table: entry.table,
            command: ACTION_TO_COMMAND[action],
            using: usingExpr,
          }),
        );
        continue;
      }

      if (action === 'insert') {
        creates.push(
          createPolicy({
            name,
            table: entry.table,
            command: ACTION_TO_COMMAND[action],
            withCheck: withCheckExpr ?? usingExpr,
          }),
        );
        continue;
      }

      creates.push(
        createPolicy({
          name,
          table: entry.table,
          command: ACTION_TO_COMMAND[action],
          using: usingExpr,
          withCheck: withCheckExpr ?? usingExpr,
        }),
      );
    }

    return { drops, creates };
  }

  function generateAllPolicies() {
    const policyGroups = TABLE_RLS_POLICY_CONFIG.map((entry) => buildTablePolicies(entry));
    const allDrops = policyGroups.flatMap((g) => g.drops);
    const allCreates = policyGroups.flatMap((g) => g.creates);
    return { drops: allDrops, creates: allCreates };
  }

  /** Drop all public policies and clear RLS flags on every ordinary public table before generated setup. */
  function generateResetPublicRls() {
    return `do $$
declare
  policy_record record;
  table_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
  end loop;

  for table_record in
    select c.relname as tablename
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table public.%I disable row level security', table_record.tablename);
    execute format('alter table public.%I no force row level security', table_record.tablename);
  end loop;
end;
$$;`;
  }

  function generateRlsSetup() {
    const enableRls = rlsTables.map((t) => alterTableRls(t, true));
    const forceRlsStatements = rlsTables.map((t) => forceRls(t, true));
    const revokes = rlsTables.map((t) => revokeTable(t, ['select', 'insert', 'update', 'delete']));

    const tablePrivilegeMap = new Map();
    for (const entry of TABLE_RLS_POLICY_CONFIG) {
      if (entry.classification === 'deny') {
        continue;
      }
      const privileges = [];
      for (const action of ['select', 'insert', 'update', 'delete']) {
        if (entry.permissions[action]) {
          privileges.push(action);
        }
      }
      if (privileges.length > 0) {
        tablePrivilegeMap.set(entry.table, privileges);
      }
    }
    const grants = [...tablePrivilegeMap.entries()].map(([table, privileges]) => grantTable(table, privileges));

    return {
      enableRls,
      forceRlsStatements,
      revokes,
      grants,
    };
  }

  return { generateAllPolicies, generateResetPublicRls, generateRlsSetup };
}
