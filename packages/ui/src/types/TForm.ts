import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { KeyboardEventHandler } from 'react';

export type BaseFieldProps<T extends FieldValues> = {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    required?: boolean;
    placeholder?: string;
    description?: string;
    className?: string;
};

export type InputFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
    inputType?: 'text' | 'email' | 'password' | 'number';
    autoComplete?: string;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
    /** When true, field validation messages are omitted (e.g. shown by a custom requirements panel). */
    hideFieldMessage?: boolean;
};

export type SelectFieldOption = {
    value: string;
    label: string;
};

export type SelectFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
    options: SelectFieldOption[];
};

export type SwitchFieldProps<T extends FieldValues> = BaseFieldProps<T>;

export type TextareaFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
    rows?: number;
};

export type JsonTextareaFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
    rows?: number;
};
