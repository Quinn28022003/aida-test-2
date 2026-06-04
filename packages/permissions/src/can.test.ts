import { describe, expect, it } from 'vitest';
import { buildAbilityFromPermissions } from './ability';
import { can, cannot, explainDenial } from './can';

describe('can', () => {
  it('allows when the built ability has a matching rule', () => {
    const ability = buildAbilityFromPermissions({
      permissions: ['conversation.read', 'message.create', 'agent.invoke'],
    });

    expect(can(ability, 'read', 'conversation')).toBe(true);
    expect(can(ability, 'create', 'message')).toBe(true);
    expect(can(ability, 'invoke', 'agent')).toBe(true);
  });

  it('denies when action and subject do not match any granted rule', () => {
    const ability = buildAbilityFromPermissions({
      permissions: ['conversation.read'],
    });

    expect(can(ability, 'create', 'message')).toBe(false);
    expect(can(ability, 'read', 'agent')).toBe(false);
    expect(can(ability, 'invoke', 'agent')).toBe(false);
  });
});

describe('cannot', () => {
  it('returns the inverse of can for the same action and subject', () => {
    const ability = buildAbilityFromPermissions({ permissions: ['vault_document.read'] });

    expect(cannot(ability, 'read', 'vault_document')).toBe(false);
    expect(cannot(ability, 'upload', 'vault_document')).toBe(true);
    expect(cannot(ability, 'read', 'conversation')).toBe(true);
  });
});

describe('explainDenial', () => {
  it('returns null when can would allow the check', () => {
    const ability = buildAbilityFromPermissions({ permissions: ['job.read'] });

    expect(can(ability, 'read', 'job')).toBe(true);
    expect(explainDenial(ability, 'read', 'job')).toBeNull();
  });

  it('returns a missing_permission reason when can would deny the check', () => {
    const ability = buildAbilityFromPermissions({ permissions: ['job.read'] });

    expect(can(ability, 'create', 'job')).toBe(false);
    expect(explainDenial(ability, 'create', 'job')).toEqual({
      code: 'missing_permission',
      action: 'create',
      subject: 'job',
      message: 'Missing permission for action "create" on subject "job".',
    });
  });
});
