import type { AppAbility, DenialReason, PermissionAction, PermissionSubject } from './permissions.types';

export function can(
  ability: AppAbility,
  action: PermissionAction,
  subject: PermissionSubject,
): boolean {
  return ability.can(action, subject);
}

export function cannot(
  ability: AppAbility,
  action: PermissionAction,
  subject: PermissionSubject,
): boolean {
  return !can(ability, action, subject);
}

export function explainDenial(
  ability: AppAbility,
  action: PermissionAction,
  subject: PermissionSubject,
): DenialReason | null {
  if (can(ability, action, subject)) {
    return null;
  }

  return {
    code: 'missing_permission',
    action,
    subject,
    message: `Missing permission for action "${action}" on subject "${subject}".`,
  };
}
