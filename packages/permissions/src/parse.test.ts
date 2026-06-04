import { describe, expect, it } from 'vitest';
import { InvalidPermissionKeyError, parsePermissionInput } from './parse';

describe('parsePermissionInput', () => {
  it('returns subject and action for a valid catalogue key', () => {
    expect(parsePermissionInput('conversation.read')).toEqual({
      permission: 'conversation.read',
      subject: 'conversation',
      action: 'read',
    });
  });

  it('parses actions with underscores after the first dot', () => {
    expect(parsePermissionInput('vault_document.hard_delete')).toEqual({
      permission: 'vault_document.hard_delete',
      subject: 'vault_document',
      action: 'hard_delete',
    });

    expect(parsePermissionInput('agent.view_all')).toEqual({
      permission: 'agent.view_all',
      subject: 'agent',
      action: 'view_all',
    });
  });

  it('rejects keys that are not in the catalogue', () => {
    expect(() => parsePermissionInput('conversation.destroy')).toThrow(
      InvalidPermissionKeyError,
    );
    expect(() => parsePermissionInput('task.delete')).toThrow(InvalidPermissionKeyError);
  });

  it.each([
    '',
    'noseparator',
    '.noResource',
    'onlydot.',
    'agent.read.extra',
    'not-valid',
  ])('throws InvalidPermissionKeyError for malformed key %j', (permissionKey) => {
    expect(() => parsePermissionInput(permissionKey)).toThrow(InvalidPermissionKeyError);
  });

  it('exposes the rejected key on InvalidPermissionKeyError', () => {
    try {
      parsePermissionInput('bad.key');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPermissionKeyError);
      expect((error as InvalidPermissionKeyError).permissionKey).toBe('bad.key');
      expect((error as InvalidPermissionKeyError).name).toBe('InvalidPermissionKeyError');
      expect((error as InvalidPermissionKeyError).message).toBe(
        'Invalid permission key: bad.key',
      );
    }
  });
});
