import { describe, expect, it } from 'vitest';

import {
    confirmPasswordSchema,
    loginFormSchema,
    passwordSchema,
    registerFormSchema,
} from './index';

describe('passwordSchema', () => {
    it('accepts a password that meets all requirements', () => {
        const result = passwordSchema.safeParse('Password1!');

        expect(result.success).toBe(true);
    });

    it('rejects with only the failed rule messages', () => {
        const result = passwordSchema.safeParse('password1!');

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.map((issue) => issue.message)).toEqual([
                'At least 1 uppercase letter',
            ]);
        }
    });
});

describe('loginFormSchema', () => {
    it('requires a non-empty password without strength rules', () => {
        expect(
            loginFormSchema.safeParse({
                email: 'user@example.com',
                password: 'any-legacy-password',
            }).success,
        ).toBe(true);

        const empty = loginFormSchema.safeParse({
            email: 'user@example.com',
            password: '',
        });

        expect(empty.success).toBe(false);
        if (!empty.success) {
            expect(empty.error.issues[0]?.message).toBe('Password is required');
        }
    });
});

describe('confirmPasswordSchema', () => {
    it('does not apply password strength rules', () => {
        const result = confirmPasswordSchema.safeParse('weak');

        expect(result.success).toBe(true);
    });
});

describe('registerFormSchema', () => {
    it('reports mismatch on confirm without strength checks on that field', () => {
        const result = registerFormSchema.safeParse({
            displayName: 'Quinn',
            email: 'user@example.com',
            password: 'Password1!',
            confirmPassword: 'different',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            const messages = result.error.issues.map((issue) => issue.message);
            expect(messages).toContain('Passwords do not match');
            expect(messages).not.toContain('At least 8 characters');
        }
    });
});
