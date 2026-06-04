import type { PasswordRule } from '../types/password.types';

/** Shared password policy used for both inline feedback and schema validation. */
export const PASSWORD_RULES: readonly PasswordRule[] = [
    {
        test: (value) => value.length >= 8,
        message: 'At least 8 characters',
    },
    {
        test: (value) => /[a-z]/.test(value),
        message: 'At least 1 lowercase letter',
    },
    {
        test: (value) => /[A-Z]/.test(value),
        message: 'At least 1 uppercase letter',
    },
    {
        test: (value) => /\d/.test(value),
        message: 'At least 1 number',
    },
    {
        test: (value) => /[^A-Za-z0-9]/.test(value),
        message: 'At least 1 special character',
    },
] as const;
