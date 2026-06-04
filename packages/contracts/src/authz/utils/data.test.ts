import { describe, expect, it } from 'vitest';
import { PERMISSIONS_OBJECT } from '../constants/data';
import { parsePermissionKey } from './data';

describe('parsePermissionKey', () => {
  describe('valid permission keys', () => {
    it('parses simple subject.action format', () => {
      expect(parsePermissionKey('conversation.read')).toEqual({
        subject: 'conversation',
        action: 'read',
      });
    });

    it('parses permission keys with underscores in subject and action', () => {
      expect(parsePermissionKey('vault_document.hard_delete')).toEqual({
        subject: 'vault_document',
        action: 'hard_delete',
      });
    });

    it('parses permission keys with underscores in action only', () => {
      expect(parsePermissionKey('agent.view_all')).toEqual({
        subject: 'agent',
        action: 'view_all',
      });
    });

    it('parses snake_case catalogue subjects', () => {
      expect(parsePermissionKey('org_member.read')).toEqual({
        subject: 'org_member',
        action: 'read',
      });
    });

    it('parses catalogue actions on a subject', () => {
      expect(parsePermissionKey('task.create')).toEqual({ subject: 'task', action: 'create' });
      expect(parsePermissionKey('task.read')).toEqual({ subject: 'task', action: 'read' });
      expect(parsePermissionKey('task.update')).toEqual({ subject: 'task', action: 'update' });
      expect(parsePermissionKey('task.delete')).toBeNull();
    });

    it('covers every PERMISSIONS_OBJECT entry', () => {
      for (const group of Object.values(PERMISSIONS_OBJECT)) {
        for (const permission of Object.values(group)) {
          expect(parsePermissionKey(permission.key)).toEqual({
            subject: permission.key.slice(0, permission.key.indexOf('.')),
            action: permission.key.slice(permission.key.indexOf('.') + 1),
          });
        }
      }
    });
  });

  describe('invalid permission keys', () => {
    it('returns null for empty string', () => {
      expect(parsePermissionKey('')).toBeNull();
    });

    it('returns null for string without dot separator', () => {
      expect(parsePermissionKey('noseparator')).toBeNull();
    });

    it('returns null for string starting with dot (no subject)', () => {
      expect(parsePermissionKey('.noResource')).toBeNull();
    });

    it('returns null for string ending with dot (no action)', () => {
      expect(parsePermissionKey('onlydot.')).toBeNull();
    });

    it('returns null for string with multiple dots', () => {
      expect(parsePermissionKey('nested.bad.action')).toBeNull();
    });

    it('returns null for unknown catalogue subjects', () => {
      expect(parsePermissionKey('X.read')).toBeNull();
      expect(parsePermissionKey('Resource.read')).toBeNull();
    });

    it('returns null for unknown actions on a known subject', () => {
      expect(parsePermissionKey('conversation.destroy')).toBeNull();
    });
  });
});
