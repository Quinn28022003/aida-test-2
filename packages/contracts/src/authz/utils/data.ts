import { PERMISSIONS_OBJECT } from '../constants/data';

type PermissionCatalogueGroup = Record<string, { readonly key: string }>;
const permissionCatalogue = PERMISSIONS_OBJECT as Record<string, PermissionCatalogueGroup>;

/**
 * Parse `subject.action` using the first dot only (action may contain underscores, e.g. `hard_delete`).
 * `subject` must match a top-level key in `PERMISSIONS_OBJECT` and `action` must exist on that group.
 */
export function parsePermissionKey(permissionKey: string): { subject: string; action: string } | null {
  const dot = permissionKey.indexOf('.');
  if (dot <= 0 || dot === permissionKey.length - 1) {
    return null;
  }

  const subject = permissionKey.slice(0, dot);
  const action = permissionKey.slice(dot + 1);
  if (!subject || !action || action.includes('.')) {
    return null;
  }

  const catalogueGroup = permissionCatalogue[subject];
  if (!catalogueGroup) {
    return null;
  }

  const entry = catalogueGroup[action as keyof typeof catalogueGroup];
  if (!entry || entry.key !== permissionKey) {
    return null;
  }

  return { subject, action };
}
