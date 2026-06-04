import type { PermissionEntry } from '../data.types';

export enum ERole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
  Support = 'support',
  ExternalUser = 'external_user',
  Viewer = 'viewer',
  Auditor = 'auditor',
  BillingManager = 'billing_manager',
  InternalDeveloper = 'internal_developer',
  PluginDeveloper = 'plugin_developer',
  Tester = 'tester',
}

export enum ERoleScope {
  Organization = 'organization',
  Internal = 'internal',
}

export enum ERlsCheckType {
  OrgPermission = 'org_permission',
  ProjectJobAccess = 'project_job_access',
  ConversationAccess = 'conversation_access',
  DocumentAccess = 'document_access',
  AgentAccess = 'agent_access',
  ReferenceRead = 'reference_read',
  ServiceOnly = 'service_only',
  ProfileAccess = 'profile_access',
}

function perm<const R extends string, const A extends string>(
  resource: R,
  action: A,
  description: string,
): PermissionEntry<`${R}.${A}`> {
  return { key: `${resource}.${action}`, description };
}

/**
 * MVP permission catalogue: `resource.action` with snake_case resources.
 * Descriptions are operator-facing catalogue text, not customer UI labels.
 */
export const PERMISSIONS_OBJECT = {
  org: {
    create: perm('org', 'create', 'Create organisations.'),
    read: perm('org', 'read', 'Read organisation rows for members.'),
    update: perm('org', 'update', 'Update organisation settings.'),
    delete: perm('org', 'delete', 'Delete organisations.'),
  },
  org_member: {
    create: perm('org_member', 'create', 'Add organisation members.'),
    read: perm('org_member', 'read', 'Read organisation membership.'),
    update: perm('org_member', 'update', 'Update organisation membership.'),
    delete: perm('org_member', 'delete', 'Remove organisation members.'),
  },
  org_member_role: {
    create: perm('org_member_role', 'create', 'Assign roles to organisation members.'),
    delete: perm('org_member_role', 'delete', 'Remove roles from organisation members.'),
  },
  org_invitation: {
    create: perm('org_invitation', 'create', 'Create organisation invitations.'),
    read: perm('org_invitation', 'read', 'Read organisation invitations.'),
    revoke: perm('org_invitation', 'revoke', 'Revoke organisation invitations.'),
  },
  org_role: {
    create: perm('org_role', 'create', 'Create roles for the organisation.'),
    read: perm('org_role', 'read', 'Read role definitions.'),
    update: perm('org_role', 'update', 'Update role definitions.'),
    delete: perm('org_role', 'delete', 'Delete roles.'),
  },
  org_group: {
    create: perm('org_group', 'create', 'Create groups.'),
    read: perm('org_group', 'read', 'Read groups.'),
    update: perm('org_group', 'update', 'Update groups.'),
    delete: perm('org_group', 'delete', 'Delete groups.'),
  },
  org_group_member: {
    create: perm('org_group_member', 'create', 'Add group members.'),
    delete: perm('org_group_member', 'delete', 'Remove group members.'),
  },
  org_group_role: {
    create: perm('org_group_role', 'create', 'Assign roles to groups.'),
    delete: perm('org_group_role', 'delete', 'Remove roles from groups.'),
  },
  project: {
    create: perm('project', 'create', 'Create projects.'),
    read: perm('project', 'read', 'Read projects.'),
    update: perm('project', 'update', 'Update projects.'),
  },
  project_member: {
    create: perm('project_member', 'create', 'Add project members.'),
    read: perm('project_member', 'read', 'Read project membership.'),
    delete: perm('project_member', 'delete', 'Remove project members.'),
  },
  job: {
    create: perm('job', 'create', 'Create customer jobs.'),
    read: perm('job', 'read', 'Read customer jobs.'),
    update: perm('job', 'update', 'Update customer jobs.'),
  },
  job_member: {
    create: perm('job_member', 'create', 'Add job members.'),
    read: perm('job_member', 'read', 'Read job membership.'),
    delete: perm('job_member', 'delete', 'Remove job members.'),
  },
  job_invitation: {
    create: perm('job_invitation', 'create', 'Create job invitations.'),
    read: perm('job_invitation', 'read', 'Read job invitations.'),
    revoke: perm('job_invitation', 'revoke', 'Revoke job invitations.'),
  },
  conversation: {
    create: perm('conversation', 'create', 'Create conversations.'),
    read: perm('conversation', 'read', 'Read conversations.'),
    update: perm('conversation', 'update', 'Update conversations.'),
  },
  conversation_member: {
    create: perm('conversation_member', 'create', 'Add conversation participants.'),
    read: perm('conversation_member', 'read', 'Read conversation membership.'),
    update: perm('conversation_member', 'update', 'Update conversation membership.'),
    delete: perm('conversation_member', 'delete', 'Remove conversation participants.'),
  },
  conversation_invitation: {
    create: perm('conversation_invitation', 'create', 'Create conversation invitations.'),
    read: perm('conversation_invitation', 'read', 'Read conversation invitations.'),
    revoke: perm('conversation_invitation', 'revoke', 'Revoke conversation invitations.'),
  },
  message: {
    create: perm('message', 'create', 'Create messages (including sends).'),
    read: perm('message', 'read', 'Read messages.'),
  },
  support_handoff: {
    create: perm('support_handoff', 'create', 'Create support handoffs.'),
    read: perm('support_handoff', 'read', 'Read support handoffs.'),
    update: perm('support_handoff', 'update', 'Update support handoffs.'),
  },
  agent: {
    create: perm('agent', 'create', 'Create agents.'),
    read: perm('agent', 'read', 'Read agents.'),
    update: perm('agent', 'update', 'Update agents.'),
    view_all: perm('agent', 'view_all', 'List all agents in scope regardless of membership.'),
    manage: perm('agent', 'manage', 'Manage agent lifecycle and configuration.'),
    invoke: perm('agent', 'invoke', 'Invoke agents.'),
    publish: perm('agent', 'publish', 'Publish agent versions.'),
    evaluate: perm('agent', 'evaluate', 'Run agent evaluation flows.'),
  },
  agent_member: {
    create: perm('agent_member', 'create', 'Grant agent access.'),
    read: perm('agent_member', 'read', 'Read agent access grants.'),
    delete: perm('agent_member', 'delete', 'Revoke agent access grants.'),
  },
  agent_invitation: {
    create: perm('agent_invitation', 'create', 'Create agent invitations.'),
    read: perm('agent_invitation', 'read', 'Read agent invitations.'),
    revoke: perm('agent_invitation', 'revoke', 'Revoke agent invitations.'),
  },
  agent_tool: {
    create: perm('agent_tool', 'create', 'Attach tools to agents.'),
    read: perm('agent_tool', 'read', 'Read agent tool attachments.'),
    delete: perm('agent_tool', 'delete', 'Remove tools from agents.'),
  },
  vault_folder: {
    create: perm('vault_folder', 'create', 'Create vault folders.'),
    read: perm('vault_folder', 'read', 'Read vault folders.'),
    update: perm('vault_folder', 'update', 'Update vault folders.'),
    delete: perm('vault_folder', 'delete', 'Delete vault folders.'),
    restore: perm('vault_folder', 'restore', 'Restore soft-deleted vault folders.'),
    hard_delete: perm('vault_folder', 'hard_delete', 'Permanently delete vault folders.'),
  },
  vault_document: {
    create: perm('vault_document', 'create', 'Create vault documents (metadata).'),
    read: perm('vault_document', 'read', 'Read vault document metadata.'),
    update: perm('vault_document', 'update', 'Update vault document metadata.'),
    upload: perm('vault_document', 'upload', 'Upload vault document content.'),
    delete: perm('vault_document', 'delete', 'Delete vault documents.'),
    restore: perm('vault_document', 'restore', 'Restore soft-deleted vault documents.'),
    hard_delete: perm('vault_document', 'hard_delete', 'Permanently delete vault documents.'),
    reindex: perm('vault_document', 'reindex', 'Reindex vault documents for retrieval.'),
    manage_permissions: perm('vault_document', 'manage_permissions', 'Manage vault document ACLs.'),
  },
  knowledge_hub: {
    create: perm('knowledge_hub', 'create', 'Create knowledge hubs.'),
    read: perm('knowledge_hub', 'read', 'Read knowledge hubs.'),
    update: perm('knowledge_hub', 'update', 'Update knowledge hubs.'),
    delete: perm('knowledge_hub', 'delete', 'Delete knowledge hubs.'),
    restore: perm('knowledge_hub', 'restore', 'Restore soft-deleted knowledge hubs.'),
    hard_delete: perm('knowledge_hub', 'hard_delete', 'Permanently delete knowledge hubs.'),
  },
  knowledge_hub_item: {
    create: perm('knowledge_hub_item', 'create', 'Add items to knowledge hubs.'),
    delete: perm('knowledge_hub_item', 'delete', 'Remove items from knowledge hubs.'),
  },
  form: {
    create: perm('form', 'create', 'Create forms.'),
    read: perm('form', 'read', 'Read forms.'),
    update: perm('form', 'update', 'Update forms.'),
    archive: perm('form', 'archive', 'Archive forms.'),
    publish: perm('form', 'publish', 'Publish forms.'),
    validate: perm('form', 'validate', 'Run form authoring validation.'),
  },
  form_field: {
    create: perm('form_field', 'create', 'Create form fields.'),
    read: perm('form_field', 'read', 'Read form fields.'),
    update: perm('form_field', 'update', 'Update form fields.'),
    delete: perm('form_field', 'delete', 'Delete form fields.'),
  },
  form_response: {
    create: perm('form_response', 'create', 'Create form responses.'),
    read: perm('form_response', 'read', 'Read form responses.'),
    update: perm('form_response', 'update', 'Update form responses.'),
    submit: perm('form_response', 'submit', 'Submit form responses.'),
  },
  tool: {
    read: perm('tool', 'read', 'Read tool definitions.'),
    invoke: perm('tool', 'invoke', 'Invoke tools.'),
  },
  approval: {
    read: perm('approval', 'read', 'Read approval requests.'),
    update: perm('approval', 'update', 'Resolve approval requests.'),
  },
  task: {
    create: perm('task', 'create', 'Create tasks.'),
    read: perm('task', 'read', 'Read tasks.'),
    update: perm('task', 'update', 'Update tasks.'),
  },
  task_checklist_item: {
    create: perm('task_checklist_item', 'create', 'Create task checklist items.'),
    read: perm('task_checklist_item', 'read', 'Read task checklist items.'),
    update: perm('task_checklist_item', 'update', 'Update task checklist items.'),
    delete: perm('task_checklist_item', 'delete', 'Delete task checklist items.'),
  },
  audit_event: {
    read: perm('audit_event', 'read', 'Read audit events.'),
  },
} as const;
