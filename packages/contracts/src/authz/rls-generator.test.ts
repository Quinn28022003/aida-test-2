import { describe, expect, it } from 'vitest';

describe('RLS generator', () => {
  it('generates organizations INSERT policy and authenticated grant', async () => {
    const { generateRlsSql } = await import('../../../../scripts/rls/generate-rls-sql.mjs');
    const { sql } = generateRlsSql();

    expect(sql).toContain('create policy "organizations_insert_access"');
    expect(sql).toContain('for INSERT');
    expect(sql).toContain('with check (created_by = current_profile_id())');
    expect(sql).toContain('grant select, insert, update, delete on "organizations" to authenticated;');
  });

  it('generates organizations SELECT bootstrap access for creator', async () => {
    const { generateRlsSql } = await import('../../../../scripts/rls/generate-rls-sql.mjs');
    const { sql } = generateRlsSql();

    expect(sql).toContain('create policy "organizations_select_access"');
    expect(sql).toContain("or created_by = current_profile_id()");
  });

  it('generates organization_members INSERT bootstrap access for self-created org', async () => {
    const { generateRlsSql } = await import('../../../../scripts/rls/generate-rls-sql.mjs');
    const { sql } = generateRlsSql();

    expect(sql).toContain('create policy "organization_members_insert_access"');
    expect(sql).toContain('create policy "organization_members_select_access"');
    expect(sql).toContain('user_id = current_profile_id()');
    expect(sql).toContain("member_type = 'internal'");
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain('o.created_by = current_profile_id()');
  });

  it('generates member_roles bootstrap access for self-created owner assignment', async () => {
    const { generateRlsSql } = await import('../../../../scripts/rls/generate-rls-sql.mjs');
    const { sql } = generateRlsSql();

    expect(sql).toContain('create policy "member_roles_insert_access"');
    expect(sql).toContain('create policy "member_roles_select_access"');
    expect(sql).toContain('user_id = current_profile_id()');
    expect(sql).toContain('assigned_by = current_profile_id()');
    expect(sql).toContain("r.key = 'owner'");
    expect(sql).toContain('grant select, insert, delete on "member_roles" to authenticated;');
  });
});
