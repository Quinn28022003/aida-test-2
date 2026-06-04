import { parsePermissionKey } from '@aida/contracts';
import type { Permission } from './permissions.types';

export class InvalidPermissionKeyError extends Error {
  readonly permissionKey: string;

  constructor(permissionKey: string) {
    super(`Invalid permission key: ${permissionKey}`);
    this.name = 'InvalidPermissionKeyError';
    this.permissionKey = permissionKey;
  }
}

export function parsePermissionInput(permissionKey: string): {
  permission: Permission;
  subject: string;
  action: string;
} {
  const parsed = parsePermissionKey(permissionKey);
  if (!parsed) {
    throw new InvalidPermissionKeyError(permissionKey);
  }

  return {
    permission: permissionKey as Permission,
    subject: parsed.subject,
    action: parsed.action,
  };
}
