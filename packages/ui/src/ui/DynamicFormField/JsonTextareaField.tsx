'use client';

import type { FieldValues } from 'react-hook-form';

import { CollapsibleJsonEditor } from './CollapsibleJsonEditor';
import type { JsonTextareaFieldProps } from '../../types/TForm';
import { cn } from '../../lib/cn';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';

export function JsonTextareaField<T extends FieldValues>(
    props: JsonTextareaFieldProps<T> & { disabled?: boolean },
) {
    const {
        control,
        name,
        label,
        required = false,
        placeholder,
        description,
        disabled = false,
        rows,
    } = props;

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
                        <CollapsibleJsonEditor
                            label={String(label)}
                            value={field.value}
                            onChange={(value: unknown) => {
                                field.onChange(value);
                            }}
                            placeholder={String(placeholder ?? '')}
                            rows={rows}
                            defaultOpen={false}
                            disabled={disabled}
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
