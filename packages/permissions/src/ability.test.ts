import { describe, expect, it } from 'vitest';
import { buildAbility, buildAbilityFromPermissions } from './ability';
import { can } from './can';
import { InvalidPermissionKeyError } from './parse';

describe('buildAbilityFromPermissions', () => {
  it('parses each catalogue key and registers one CASL allow rule per key', () => {
    const ability = buildAbilityFromPermissions({
      permissions: ['conversation.read', 'message.create', 'agent.invoke'],
    });

    expect(ability.rules).toHaveLength(3);
    expect(can(ability, 'read', 'conversation')).toBe(true);
    expect(can(ability, 'create', 'message')).toBe(true);
    expect(can(ability, 'invoke', 'agent')).toBe(true);
  });

  it('denies actions that were not granted for the subject', () => {
    const ability = buildAbilityFromPermissions({
      permissions: ['conversation.read'],
    });

    expect(can(ability, 'create', 'message')).toBe(false);
    expect(can(ability, 'read', 'agent')).toBe(false);
    expect(can(ability, 'invoke', 'agent')).toBe(false);
  });

  it('throws before building when any permission key is invalid', () => {
    expect(() =>
      buildAbilityFromPermissions({ permissions: ['not-valid'] }),
    ).toThrow(InvalidPermissionKeyError);
    expect(() =>
      buildAbilityFromPermissions({ permissions: ['agent.read.extra'] }),
    ).toThrow(InvalidPermissionKeyError);
    expect(() =>
      buildAbilityFromPermissions({ permissions: ['', 'conversation.read'] }),
    ).toThrow(InvalidPermissionKeyError);
  });

  it('builds one ability from a merged permissions payload', () => {
    const ability = buildAbilityFromPermissions({
      permissions: ['org.read', 'form.read', 'task.create'],
    });

    expect(can(ability, 'read', 'org')).toBe(true);
    expect(can(ability, 'read', 'form')).toBe(true);
    expect(can(ability, 'create', 'task')).toBe(true);
    expect(can(ability, 'delete', 'task')).toBe(false);
  });
});

describe('buildAbility', () => {
  it('accepts a flat permission key array via buildAbilityFromPermissions', () => {
    const ability = buildAbility(['agent.read']);

    expect(can(ability, 'read', 'agent')).toBe(true);
    expect(can(ability, 'invoke', 'agent')).toBe(false);
  });
});

describe('package boundaries', () => {
  it('does not import Supabase, API, cache, or server context modules', async () => {
    const sourceModules = ['./ability', './can', './parse', './permissions.types'] as const;

    for (const modulePath of sourceModules) {
      const mod = await import(modulePath);
      expect(mod).not.toHaveProperty('createClient');
      expect(mod).not.toHaveProperty('kv');
      expect(mod).not.toHaveProperty('loadPermissionContext');
    }
  });
});
