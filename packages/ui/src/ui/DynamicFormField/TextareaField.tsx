'use client';

import type { FieldValues } from 'react-hook-form';

import type { TextareaFieldProps } from '../../types/TForm';
import { cn } from '../../lib/cn';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Textarea } from '../textarea';

export function TextareaField<T extends FieldValues>(
    props: TextareaFieldProps<T> & { disabled?: boolean },
) {
    const {
        control,
        name,
        label,
        required = false,
        placeholder,
        description,
        className = '',
        disabled = false,
        rows,
    } = props;

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <FormItem className="w-full">
                    <FormLabel className={cn(disabled && 'opacity-70')}>
                        {label}
                        {required ? <span className="text-destructive"> *</span> : null}
                    </FormLabel>
                    <FormControl>
                        <Textarea
                            {...field}
                            value={field.value ?? ''}
                            placeholder={placeholder}
                            rows={rows}
                            disabled={disabled}
                            className={cn(error && 'border-destructive', className)}
                            aria-invalid={Boolean(error)}
                        />
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
