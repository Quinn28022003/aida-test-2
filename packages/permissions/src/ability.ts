import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { parsePermissionInput } from './parse';
import type { AppAbility, PermissionPayload } from './permissions.types';

export function buildAbilityFromPermissions(payload: PermissionPayload): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const permissionKey of payload.permissions) {
    const { action, subject } = parsePermissionInput(permissionKey);
    can(action, subject);
  }

  return build();
}

/** @deprecated Use `buildAbilityFromPermissions` with a `{ permissions }` payload. */
export function buildAbility(permissionKeys: readonly string[]): AppAbility {
  return buildAbilityFromPermissions({ permissions: permissionKeys });
}
