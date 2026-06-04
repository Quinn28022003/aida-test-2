import type { ERlsCheckType, ERole, ERoleScope, PERMISSIONS_OBJECT } from './constants/data';
import type { TableName } from './constants/tables';

/** One catalogue entry: key is always `resource.action` (first dot separates resource from action). */
export type PermissionEntry<K extends string = string> = {
  key: K;
  description: string;
};

type PermissionObject = typeof PERMISSIONS_OBJECT;
type PermissionResource = keyof PermissionObject;

type KeysOfGroup<G> = G extends Record<string, PermissionEntry> ? G[keyof G]['key'] : never;

export type PermissionKeys = {
  [R in PermissionResource]: KeysOfGroup<PermissionObject[R]>;
}[PermissionResource];

export type PermissionDefinition = {
  key: PermissionKeys;
  description: string;
};

export type RoleDefinition = {
  key: ERole;
  label: string;
  description: string;
  scope: ERoleScope;
  permissions: PermissionKeys[];
};

export type TableRlsPolicyConfig = {
  table: TableName;
  checkType: ERlsCheckType;
  description: string;
  classification?: 'domain' | 'reference' | 'deny';
  permissions: Partial<Record<'select' | 'insert' | 'update' | 'delete', PermissionKeys>>;
};
