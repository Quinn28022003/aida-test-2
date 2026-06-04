import { describe, expect, it } from 'vitest';
import {
  ERole,
  ERoleScope,
  ERlsCheckType,
  PERMISSIONS,
  PERMISSIONS_OBJECT,
  READ_PERMISSION_KEYS,
  ROLES,
  TABLE_RLS_POLICY_CONFIG,
  TABLES,
  parsePermissionKey,
} from './index';

describe('authz contracts', () => {
  describe('PERMISSIONS', () => {
    it('has unique permission keys', () => {
      const keys = PERMISSIONS.map((permission) => permission.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('every permission has a non-empty key', () => {
      for (const permission of PERMISSIONS) {
        expect(permission.key).toBeTruthy();
        expect(typeof permission.key).toBe('string');
      }
    });

    it('every permission has a non-empty description', () => {
      for (const permission of PERMISSIONS) {
        expect(permission.description).toBeTruthy();
        expect(typeof permission.description).toBe('string');
      }
    });

    it('all permission keys follow resource.action format', () => {
      for (const permission of PERMISSIONS) {
        const parsed = parsePermissionKey(permission.key);
        expect(parsed).not.toBeNull();
        expect(parsed?.subject).toBeTruthy();
        expect(parsed?.action).toBeTruthy();
      }
    });

    it('includes MVP ticket permission keys', () => {
      const keys = new Set(PERMISSIONS.map((permission) => permission.key));
      expect(keys.has('org.read')).toBe(true);
      expect(keys.has('vault_document.upload')).toBe(true);
      expect(keys.has('agent.invoke')).toBe(true);
    });

    it('PERMISSIONS is derived from PERMISSIONS_OBJECT', () => {
      const expectedCount = Object.values(PERMISSIONS_OBJECT).reduce(
        (count, group) => count + Object.keys(group).length,
        0,
      );
      expect(PERMISSIONS.length).toBe(expectedCount);
    });
  });

  describe('READ_PERMISSION_KEYS', () => {
    it('contains only keys ending with .read', () => {
      for (const key of READ_PERMISSION_KEYS) {
        expect(key.endsWith('.read')).toBe(true);
      }
    });

    it('all read keys exist in PERMISSIONS', () => {
      const permissionKeys = new Set(PERMISSIONS.map((p) => p.key));
      for (const key of READ_PERMISSION_KEYS) {
        expect(permissionKeys.has(key)).toBe(true);
      }
    });

    it('contains all .read permissions from PERMISSIONS', () => {
      const readPermissionsFromPermissions = PERMISSIONS.filter((p) => p.key.endsWith('.read')).map((p) => p.key);
      expect(READ_PERMISSION_KEYS.sort()).toEqual(readPermissionsFromPermissions.sort());
    });
  });

  describe('ROLES', () => {
    it('has unique role keys', () => {
      const keys = ROLES.map((role) => role.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('every role has required fields', () => {
      for (const role of ROLES) {
        expect(role.key).toBeTruthy();
        expect(role.label).toBeTruthy();
        expect(role.description).toBeTruthy();
        expect(role.scope).toBeTruthy();
        expect(Array.isArray(role.permissions)).toBe(true);
      }
    });

    it('every role permission maps to existing permission key', () => {
      const permissionKeys = new Set(PERMISSIONS.map((permission) => permission.key));
      for (const role of ROLES) {
        for (const permission of role.permissions) {
          expect(permissionKeys.has(permission)).toBe(true);
        }
      }
    });

    it('Owner role has all permissions', () => {
      const ownerRole = ROLES.find((r) => r.key === ERole.Owner);
      expect(ownerRole).toBeDefined();
      const allPermissionKeys = PERMISSIONS.map((p) => p.key).sort();
      expect(ownerRole!.permissions.sort()).toEqual(allPermissionKeys);
    });

    it('Admin role has all permissions', () => {
      const adminRole = ROLES.find((r) => r.key === ERole.Admin);
      expect(adminRole).toBeDefined();
      const allPermissionKeys = PERMISSIONS.map((p) => p.key).sort();
      expect(adminRole!.permissions.sort()).toEqual(allPermissionKeys);
    });

    it('Viewer role has only read permissions', () => {
      const viewerRole = ROLES.find((r) => r.key === ERole.Viewer);
      expect(viewerRole).toBeDefined();
      expect(viewerRole!.permissions.sort()).toEqual(READ_PERMISSION_KEYS.slice().sort());
    });

    it('Auditor role has only read permissions', () => {
      const auditorRole = ROLES.find((r) => r.key === ERole.Auditor);
      expect(auditorRole).toBeDefined();
      expect(auditorRole!.permissions.sort()).toEqual(READ_PERMISSION_KEYS.slice().sort());
    });

    it('Support role has Internal scope', () => {
      const supportRole = ROLES.find((r) => r.key === ERole.Support);
      expect(supportRole).toBeDefined();
      expect(supportRole!.scope).toBe(ERoleScope.Internal);
    });

    it('External User role is seeded', () => {
      const externalRole = ROLES.find((r) => r.key === ERole.ExternalUser);
      expect(externalRole).toBeDefined();
      expect(externalRole!.label).toBe('External User');
    });

    it('seeds all MVP system roles from the ticket', () => {
      const expectedKeys = [
        ERole.Owner,
        ERole.Admin,
        ERole.Member,
        ERole.Support,
        ERole.ExternalUser,
        ERole.Viewer,
        ERole.Auditor,
        ERole.BillingManager,
        ERole.InternalDeveloper,
        ERole.PluginDeveloper,
        ERole.Tester,
      ];
      expect(ROLES.map((role) => role.key).sort()).toEqual(expectedKeys.sort());
    });

    it('all non-Support roles have Organization scope', () => {
      for (const role of ROLES) {
        if (role.key !== ERole.Support) {
          expect(role.scope).toBe(ERoleScope.Organization);
        }
      }
    });
  });

  describe('TABLE_RLS_POLICY_CONFIG', () => {
    it('maps only to known tables', () => {
      const knownTables = new Set<string>(Object.values(TABLES));
      for (const entry of TABLE_RLS_POLICY_CONFIG) {
        expect(knownTables.has(entry.table)).toBe(true);
      }
    });

    it('has unique table entries', () => {
      const tables = TABLE_RLS_POLICY_CONFIG.map((entry) => entry.table);
      const uniqueTables = new Set(tables);
      expect(uniqueTables.size).toBe(tables.length);
    });

    it('every entry has required fields', () => {
      for (const entry of TABLE_RLS_POLICY_CONFIG) {
        expect(entry.table).toBeTruthy();
        expect(entry.checkType).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(entry.permissions).toBeDefined();
      }
    });

    it('all permission keys in RLS config exist in PERMISSIONS', () => {
      const permissionKeys = new Set(PERMISSIONS.map((p) => p.key));
      for (const entry of TABLE_RLS_POLICY_CONFIG) {
        for (const action of Object.values(entry.permissions)) {
          if (action) {
            expect(permissionKeys.has(action)).toBe(true);
          }
        }
      }
    });

    it('has valid check types', () => {
      const validCheckTypes = new Set(Object.values(ERlsCheckType));
      for (const entry of TABLE_RLS_POLICY_CONFIG) {
        expect(validCheckTypes.has(entry.checkType)).toBe(true);
      }
    });

    it('permissions table uses ReferenceRead check type', () => {
      const permissionsEntry = TABLE_RLS_POLICY_CONFIG.find((e) => e.table === TABLES.PERMISSIONS);
      expect(permissionsEntry).toBeDefined();
      expect(permissionsEntry!.checkType).toBe(ERlsCheckType.ReferenceRead);
    });

    it('profiles table uses ProfileAccess check type', () => {
      const profilesEntry = TABLE_RLS_POLICY_CONFIG.find((e) => e.table === TABLES.PROFILES);
      expect(profilesEntry).toBeDefined();
      expect(profilesEntry!.checkType).toBe(ERlsCheckType.ProfileAccess);
    });

    it('maps organisation table actions to matching org permissions', () => {
      const organizationsEntry = TABLE_RLS_POLICY_CONFIG.find((e) => e.table === TABLES.ORGANIZATIONS);
      expect(organizationsEntry).toBeDefined();
      expect(organizationsEntry!.permissions).toEqual({
        select: 'org.read',
        insert: 'org.create',
        update: 'org.update',
        delete: 'org.delete',
      });
    });

    it('keeps the RLS policy table list aligned with expected tables', () => {
      const TABLES_WITH_RLS_POLICIES_SORTED = [
        TABLES.AGENTS,
        TABLES.AGENT_INVITATIONS,
        TABLES.AGENT_INVOCATIONS,
        TABLES.AGENT_MEMBERS,
        TABLES.AGENT_VERSIONS,
        TABLES.PROJECT_AGENTS,
        TABLES.CONVERSATION_INVITATIONS,
        TABLES.CONVERSATION_MEMBERS,
        TABLES.CONVERSATION_USER_STATE,
        TABLES.CONVERSATIONS,
        TABLES.DOCUMENT_ACL,
        TABLES.DOCUMENT_CHUNKS,
        TABLES.DOCUMENT_CHUNK_SOURCES,
        TABLES.DOCUMENTS,
        TABLES.GROUP_MEMBERS,
        TABLES.GROUP_ROLES,
        TABLES.GROUPS,
        TABLES.JOB_INVITATIONS,
        TABLES.JOB_MEMBERS,
        TABLES.JOBS,
        TABLES.MESSAGE_ATTACHMENTS,
        TABLES.MESSAGE_MENTIONS,
        TABLES.MESSAGES,
        TABLES.MEMBER_ROLES,
        TABLES.ORGANIZATION_INVITATIONS,
        TABLES.ORGANIZATION_MEMBERS,
        TABLES.ORGANIZATIONS,
        TABLES.PERMISSIONS,
        TABLES.PROFILES,
        TABLES.PROJECT_MEMBERS,
        TABLES.PROJECTS,
        TABLES.RETRIEVAL_EVENTS,
        TABLES.ROLE_PERMISSIONS,
        TABLES.ROLES,
        TABLES.VAULT_FOLDERS,
      ].sort();

      const configured = TABLE_RLS_POLICY_CONFIG.map((entry) => entry.table).sort();
      expect(configured).toEqual(TABLES_WITH_RLS_POLICIES_SORTED);
    });
  });

  describe('parsePermissionKey', () => {
    it('parses resource.action permission keys (first dot only)', () => {
      expect(parsePermissionKey('conversation.read')).toEqual({ subject: 'conversation', action: 'read' });
      expect(parsePermissionKey('vault_document.upload')).toEqual({
        subject: 'vault_document',
        action: 'upload',
      });
      expect(parsePermissionKey('agent.view_all')).toEqual({ subject: 'agent', action: 'view_all' });
    });

    it('rejects invalid permission key shapes', () => {
      expect(parsePermissionKey('')).toBeNull();
      expect(parsePermissionKey('noseparator')).toBeNull();
      expect(parsePermissionKey('.noResource')).toBeNull();
      expect(parsePermissionKey('onlydot.')).toBeNull();
      expect(parsePermissionKey('nested.bad.action')).toBeNull();
    });
  });
});
