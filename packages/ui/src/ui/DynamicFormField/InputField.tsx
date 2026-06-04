'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import type { FieldValues } from 'react-hook-form';

import type { InputFieldProps } from '../../types/TForm';
import { cn } from '../../lib/cn';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Input } from '../input';

export function InputField<T extends FieldValues>(
    props: InputFieldProps<T> & { disabled?: boolean },
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
        inputType = 'text',
        autoComplete,
        onKeyDown,
        hideFieldMessage = false,
    } = props;

    const [passwordVisible, setPasswordVisible] = React.useState(false);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => {
                const commonProps = {
                    placeholder,
                    className: cn(error && 'border-destructive', className),
                    'aria-invalid': Boolean(error),
                    disabled,
                    autoComplete,
                    onKeyDown,
                };

                const valueProps = {
                    ...field,
                    value: field.value ?? '',
                };

                return (
                    <FormItem className="w-full">
                        <FormLabel className={cn(disabled && 'opacity-70')}>
                            {label}
                            {required ? <span className="text-destructive"> *</span> : null}
                        </FormLabel>
                        {inputType === 'password' ? (
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        {...valueProps}
                                        {...commonProps}
                                        type={passwordVisible ? 'text' : 'password'}
                                        className={cn('pr-11', commonProps.className)}
                                    />
                                </FormControl>
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    onClick={() => {
                                        setPasswordVisible((current) => !current);
                                    }}
                                    aria-label={
                                        passwordVisible ? 'Hide password' : 'Show password'
                                    }
                                    aria-pressed={passwordVisible}
                                >
                                    {passwordVisible ? (
                                        <EyeOff className="size-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="size-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        ) : (
                            <FormControl>
                                {inputType === 'number' ? (
                                    <Input
                                        {...commonProps}
                                        type="number"
                                        name={field.name}
                                        ref={field.ref}
                                        onBlur={field.onBlur}
                                        value={field.value ?? ''}
                                        onChange={(event) => {
                                            const val = event.target.value;
                                            field.onChange(val === '' ? undefined : Number(val));
                                        }}
                                    />
                                ) : (
                                    <Input
                                        {...valueProps}
                                        {...commonProps}
                                        type={inputType}
                                    />
                                )}
                            </FormControl>
                        )}
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
                        {hideFieldMessage ? null : <FormMessage />}
                    </FormItem>
                );
            }}
        />
    );
}
