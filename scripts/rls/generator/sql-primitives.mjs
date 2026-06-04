/**
 * Low-level SQL fragments for RLS sync output (deterministic, explicit).
 */

/** @param {string} policyName @param {string} tableName */
export function dropPolicy(policyName, tableName) {
  return `drop policy if exists "${policyName}" on "${tableName}";`;
}

/** @param {{ name: string, table: string, command: string, using?: string, withCheck?: string, permissive?: boolean }} def */
export function createPolicy(def) {
  const asClause = def.permissive === false ? 'as restrictive ' : '';
  const usingClause = def.using ? `\n  using (${def.using})` : '';
  const withCheckClause = def.withCheck ? `\n  with check (${def.withCheck})` : '';
  return `create policy "${def.name}"\n  on "${def.table}"\n  ${asClause}for ${def.command}${usingClause}${withCheckClause};`;
}

export function dropFunction(functionName, args = '') {
  return `drop function if exists ${functionName}(${args});`;
}

/** @param {{ name: string, args: string, returns: string, body: string, securityDefiner?: boolean, stable?: boolean, searchPath?: string }} def */
export function createFunction(def) {
  const securityClause = def.securityDefiner ? ' security definer' : '';
  const stableClause = def.stable ? ' stable' : '';
  const searchPathClause = def.searchPath ? `\n  set search_path = ${def.searchPath}` : '';
  return `create or replace function ${def.name}(${def.args})\n  returns ${def.returns}${securityClause}${stableClause}${searchPathClause}\n  language plpgsql\n  as $$\n${def.body}\n$$;`;
}

export function alterTableRls(tableName, enable = true) {
  const action = enable ? 'enable' : 'disable';
  return `alter table "${tableName}" ${action} row level security;`;
}

export function grantTable(tableName, privileges) {
  return `grant ${privileges.join(', ')} on "${tableName}" to authenticated;`;
}

export function revokeTable(tableName, privileges) {
  return `revoke ${privileges.join(', ')} on "${tableName}" from authenticated;`;
}

export function migrationHeader(title, description) {
  return `-- ${title}\n--\n-- ${description}\n--\n-- Generated: ${new Date().toISOString()}\n`;
}

export function section(statements) {
  return statements.filter(Boolean).join('\n\n');
}

export function forceRls(tableName, enable = true) {
  const action = enable ? 'force' : 'no force';
  return `alter table "${tableName}" ${action} row level security;`;
}
