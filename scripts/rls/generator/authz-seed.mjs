/**
 * Permission catalogue and system-role seed DML from contract arrays.
 */

export function buildSeedStatements({ PERMISSIONS, ROLES }) {
  const permissionKeyListSql = PERMISSIONS.map((permission) => `'${permission.key.replace(/'/g, "''")}'`).join(', ');

  const permissionStatements = PERMISSIONS.map((permission) => {
    const escapedDescription = permission.description.replace(/'/g, "''");
    return `insert into permissions (key, description)
values ('${permission.key}', '${escapedDescription}')
on conflict (key) do update set description = excluded.description;`;
  });

  const pruneStatements = [
    `delete from role_permissions where permission_key not in (${permissionKeyListSql});`,
    `delete from permissions where key not in (${permissionKeyListSql});`,
  ];

  const roleStatements = ROLES.map((role) => {
    const escapedLabel = role.label.replace(/'/g, "''");
    const escapedDescription = role.description.replace(/'/g, "''");
    return `update roles
set name = '${escapedLabel}',
    description = '${escapedDescription}',
    is_system = true
where org_id is null
  and key = '${role.key}';

insert into roles (org_id, key, name, description, is_system)
select null, '${role.key}', '${escapedLabel}', '${escapedDescription}', true
where not exists (
  select 1 from roles
  where org_id is null
    and key = '${role.key}'
);`;
  });

  const rolePermissionPruneStatements = ROLES.map((role) => {
    const permissionKeyListSql = role.permissions.map((key) => `'${key.replace(/'/g, "''")}'`).join(', ');
    return `delete from role_permissions rp
using roles r
where rp.role_id = r.id
  and r.org_id is null
  and r.key = '${role.key}'
  and rp.permission_key not in (${permissionKeyListSql});`;
  });

  const rolePermissionStatements = ROLES.flatMap((role) =>
    role.permissions.map(
      (permissionKey) => `insert into role_permissions (role_id, permission_key)
select r.id, '${permissionKey}'
from roles r
where r.org_id is null
  and r.key = '${role.key}'
on conflict (role_id, permission_key) do nothing;`,
    ),
  );

  return {
    permissions: permissionStatements,
    prune: pruneStatements,
    roles: roleStatements,
    rolePermissionPrune: rolePermissionPruneStatements,
    rolePermissions: rolePermissionStatements,
  };
}
