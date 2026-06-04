import { PASSWORD_RULES } from '../constants';
import type { PasswordStrengthLabel } from '../types/password.types';

/** Keep the UI wording friendly without changing the underlying strength buckets. */
export function getPasswordStrengthDisplayLabel(label: PasswordStrengthLabel): string {
    if (label === 'Fair') {
        return 'Medium';
    }

    return label;
}

/** Map each strength bucket to the colour used by the password meter. */
export function getPasswordStrengthBarClassName(label: PasswordStrengthLabel): string {
    switch (label) {
        case 'Weak':
            return 'bg-destructive';
        case 'Fair':
            return 'bg-orange-500';
        case 'Good':
            return 'bg-amber-500';
        case 'Strong':
            return 'bg-green-600';
    }
}

/** Return the user-facing rule messages for every password rule that still fails. */
export function getPasswordRuleFailures(value: string): string[] {
    return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.message);
}

/** Score the password by counting passed rules, then map that count to a simple label. */
export function getPasswordStrength(value: string): {
    passed: number;
    total: number;
    label: PasswordStrengthLabel;
} {
    const total = PASSWORD_RULES.length;
    const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;

    let label: PasswordStrengthLabel;
    if (passed <= 1) {
        label = 'Weak';
    } else if (passed <= 3) {
        label = 'Fair';
    } else if (passed === 4) {
        label = 'Good';
    } else {
        label = 'Strong';
    }

    return { passed, total, label };
}
