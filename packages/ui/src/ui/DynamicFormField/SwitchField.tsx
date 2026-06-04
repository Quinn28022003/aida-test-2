'use client';

import type { FieldValues } from 'react-hook-form';

import type { SwitchFieldProps } from '../../types/TForm';
import { cn } from '../../lib/cn';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Switch } from '../switch';

export function SwitchField<T extends FieldValues>(
    props: SwitchFieldProps<T> & { disabled?: boolean },
) {
    const { control, name, label, required = false, description, disabled = false } = props;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="w-full">
                    <FormLabel className={cn(disabled && 'opacity-70')}>
                        {label}
                        {required ? <span className="text-destructive"> *</span> : null}
                    </FormLabel>
                    <FormControl>
                        <div className="flex w-full items-center justify-between">
                            <Switch
                                checked={Boolean(field.value)}
                                onCheckedChange={(checked: boolean) => {
                                    field.onChange(checked);
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </FormControl>
                    {description ? (
                        <p
                            className={cn(
                                'text-sm text-muted-foreground',
                                disabled && 'opacity-70',
                            )}
                        >
                            {description}
                        </p>
                    ) : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
