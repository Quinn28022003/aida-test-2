import { z } from 'zod';

import { getPasswordRuleFailures } from '../utils/passwordStrength';

/** Shared email field rules reused across auth forms. */
export const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address');

/** Add one issue per failed password rule so the form can show granular feedback. */
export const passwordSchema = z.string().superRefine((value, ctx) => {
    for (const message of getPasswordRuleFailures(value)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
        });
    }
});

/** Sign-in only — no strength rules; auth errors come from the server. */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/** Confirm field — required only; match is checked via form refine. */
export const confirmPasswordSchema = z.string().min(1, 'Confirm password is required');

/** Login keeps validation intentionally light because credential correctness is server-owned. */
export const loginFormSchema = z.object({
    email: emailSchema,
    password: loginPasswordSchema,
});

/** Registration requires a strong password and confirms both password fields match. */
export const registerFormSchema = z
    .object({
        displayName: z.string().trim().min(1, 'Display name is required'),
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const resetPasswordRequestFormSchema = z.object({
    email: emailSchema,
});

/** Password reset reuses the same strength policy as registration. */
export const resetPasswordUpdateFormSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
