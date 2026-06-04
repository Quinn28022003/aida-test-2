'use client';

import {
    Controller,
    useFormContext,
    type Control,
    type FieldPath,
    type FieldValues,
} from 'react-hook-form';

import { MultiSelect, type SelectOption } from './MultiSelect';
import { cn } from '../../lib/cn';
import { FormControl, FormDescription, FormItem, FormMessage } from '../form';
import { Label } from '../label';

export type { SelectOption };

interface MultiSelectFieldProps<TFieldValues extends FieldValues = FieldValues> {
    name: FieldPath<TFieldValues>;
    control?: Control<TFieldValues>;
    options: SelectOption[];
    requiredValues?: string[];
    label?: string;
    description?: string;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    maxDisplayCount?: number;
    showSearch?: boolean;
    className?: string;
    containerClassName?: string;
    classNamePopover?: string;
}

/** @deprecated Use MultiSelectFieldProps instead */
export type MultiRoleSelectorFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
    MultiSelectFieldProps<TFieldValues>,
    'options' | 'requiredValues'
> & {
    roles: SelectOption[];
    requiredRoles?: string[];
};

export function MultiSelectField<TFieldValues extends FieldValues = FieldValues>({
    name,
    control,
    options,
    requiredValues = [],
    label,
    description,
    placeholder = 'Select options...',
    isLoading = false,
    disabled = false,
    maxDisplayCount = 3,
    showSearch = true,
    className,
    containerClassName,
    classNamePopover,
}: MultiSelectFieldProps<TFieldValues>) {
    const formContext = useFormContext<TFieldValues>();
    const formControl = control ?? formContext?.control;

    if (!formControl) {
        throw new Error(
            'MultiSelectField must be used within a FormProvider or with an explicit control prop',
        );
    }

    return (
        <Controller
            name={name}
            control={formControl}
            render={({ field, fieldState }) => (
                <FormItem className={containerClassName}>
                    {label ? <Label>{label}</Label> : null}
                    <FormControl>
                        <MultiSelect
                            options={options}
                            selectedValues={Array.isArray(field.value) ? field.value : []}
                            onValueChange={(newValues: string[]) => {
                                field.onChange(newValues);
                            }}
                            requiredValues={requiredValues}
                            placeholder={placeholder}
                            isLoading={isLoading}
                            disabled={disabled}
                            maxDisplayCount={maxDisplayCount}
                            showSearch={showSearch}
                            className={cn(fieldState.error && 'border-destructive', className)}
                            classNamePopover={classNamePopover}
                        />
                    </FormControl>
                    {description ? <FormDescription>{description}</FormDescription> : null}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

/** @deprecated Use MultiSelectField instead */
export function MultiRoleSelectorField<TFieldValues extends FieldValues = FieldValues>({
    roles,
    requiredRoles,
    ...rest
}: MultiRoleSelectorFieldProps<TFieldValues>) {
    return <MultiSelectField options={roles} requiredValues={requiredRoles} {...rest} />;
}

interface ControlledMultiSelectProps {
    options: SelectOption[];
    value: string[] | null | undefined;
    onChange: (values: string[]) => void;
    onBlur?: () => void;
    requiredValues?: string[];
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    maxDisplayCount?: number;
    showSearch?: boolean;
    className?: string;
    hasError?: boolean;
}

/** @deprecated Use ControlledMultiSelectProps instead */
export type ControlledMultiRoleSelectorProps = Omit<
    ControlledMultiSelectProps,
    'options' | 'requiredValues'
> & {
    roles: SelectOption[];
    requiredRoles?: string[];
};

export function ControlledMultiSelect({
    options,
    value,
    onChange,
    onBlur,
    requiredValues = [],
    placeholder = 'Select options...',
    isLoading = false,
    disabled = false,
    maxDisplayCount = 3,
    showSearch = true,
    className,
    hasError = false,
}: ControlledMultiSelectProps) {
    return (
        <MultiSelect
            options={options}
            selectedValues={Array.isArray(value) ? value : []}
            onValueChange={(newValues: string[]) => {
                onChange(newValues);
                onBlur?.();
            }}
            requiredValues={requiredValues}
            placeholder={placeholder}
            isLoading={isLoading}
            disabled={disabled}
            maxDisplayCount={maxDisplayCount}
            showSearch={showSearch}
            className={cn(hasError && 'border-destructive', className)}
        />
    );
}

/** @deprecated Use ControlledMultiSelect instead */
export function ControlledMultiRoleSelector({
    roles,
    requiredRoles,
    ...rest
}: ControlledMultiRoleSelectorProps) {
    return <ControlledMultiSelect options={roles} requiredValues={requiredRoles} {...rest} />;
}
