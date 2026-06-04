'use client';

import type { FieldValues } from 'react-hook-form';

import type { SelectFieldProps } from '../../types/TForm';
import { cn } from '../../lib/cn';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

export function SelectField<T extends FieldValues>(
    props: SelectFieldProps<T> & { disabled?: boolean },
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
        options,
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
                    <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger
                                className={cn(error && 'border-destructive', className)}
                                aria-invalid={Boolean(error)}
                            >
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
