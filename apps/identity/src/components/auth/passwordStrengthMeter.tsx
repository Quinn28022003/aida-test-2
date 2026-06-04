'use client';

import { cn, RuleMetIcon, RuleUnmetIcon } from '@aida/ui';
import { useFormContext, useWatch } from 'react-hook-form';

import {
    getPasswordStrength,
    getPasswordStrengthBarClassName,
    getPasswordStrengthDisplayLabel,
} from '@/lib/auth/utils/passwordStrength';
import { PASSWORD_RULES } from '@/lib/auth/constants';

type PasswordStrengthMeterProps = {
    passwordFieldName?: string;
};

export function PasswordStrengthMeter({ passwordFieldName = 'password' }: PasswordStrengthMeterProps) {
    const { control } = useFormContext();
    const password = useWatch({ control, name: passwordFieldName, defaultValue: '' });
    const value = typeof password === 'string' ? password : '';

    if (value.length === 0) {
        return null;
    }

    const { passed, total, label } = getPasswordStrength(value);
    const displayLabel = getPasswordStrengthDisplayLabel(label);
    const barClassName = getPasswordStrengthBarClassName(label);

    return (
        <div aria-live="polite" className="space-y-2.5 pt-1">
            <div
                className="flex w-full gap-1"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={passed}
                aria-label={`Password strength: ${displayLabel}`}
            >
                {Array.from({ length: total }, (_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-200',
                            index < passed ? barClassName : 'bg-muted',
                        )}
                    />
                ))}
            </div>

            <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{displayLabel} password.</span> Must contain:
            </p>

            <ul className="space-y-1.5" aria-label="Password requirements">
                {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(value);

                    return (
                        <li
                            key={rule.message}
                            className={cn(
                                'flex items-center gap-2 text-sm',
                                met ? 'text-green-600' : 'text-muted-foreground',
                            )}
                        >
                            {met ? <RuleMetIcon /> : <RuleUnmetIcon />}
                            <span>{rule.message}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
