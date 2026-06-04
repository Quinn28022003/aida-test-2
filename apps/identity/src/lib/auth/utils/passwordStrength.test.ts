import { describe, expect, it } from 'vitest';

import { getPasswordRuleFailures, getPasswordStrength } from './passwordStrength';

describe('getPasswordRuleFailures', () => {
    it('returns only missing rules for a numeric password with punctuation', () => {
        expect(getPasswordRuleFailures('123123123123. 123')).toEqual([
            'At least 1 lowercase letter',
            'At least 1 uppercase letter',
        ]);
    });

    it('returns no failures when all rules pass', () => {
        expect(getPasswordRuleFailures('Password1!')).toEqual([]);
    });
});

describe('getPasswordStrength', () => {
    it('labels empty-adjacent weak passwords as Weak', () => {
        expect(getPasswordStrength('1').label).toBe('Weak');
    });

    it('labels a fully valid password as Strong', () => {
        expect(getPasswordStrength('Password1!')).toEqual({
            passed: 5,
            total: 5,
            label: 'Strong',
        });
    });
});
