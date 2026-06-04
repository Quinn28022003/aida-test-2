'use client';

import * as React from 'react';

import { cn } from '../../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

export type SelectOption = {
    key: string;
    label: string;
    description?: string;
};

type MultiSelectProps = {
    options: SelectOption[];
    selectedValues: string[];
    onValueChange: (values: string[]) => void;
    requiredValues?: string[];
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;
    maxDisplayCount?: number;
    showSearch?: boolean;
    className?: string;
    classNamePopover?: string;
};

export function MultiSelect({
    options,
    selectedValues,
    onValueChange,
    requiredValues = [],
    placeholder = 'Select options...',
    isLoading = false,
    disabled = false,
    maxDisplayCount = 3,
    className,
    classNamePopover,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const selectedSet = React.useMemo(() => new Set(selectedValues), [selectedValues]);

    const selectedLabels = options
        .filter((option) => selectedSet.has(option.key))
        .map((option) => option.label);

    let displayText = placeholder;

    if (selectedLabels.length > 0) {
        displayText = selectedLabels.join(', ');
    }

    if (selectedLabels.length > maxDisplayCount) {
        displayText = `${selectedLabels.slice(0, maxDisplayCount).join(', ')} +${selectedLabels.length - maxDisplayCount}`;
    }

    const toggleValue = (key: string) => {
        if (requiredValues.includes(key)) {
            return;
        }

        const next = selectedSet.has(key)
            ? selectedValues.filter((value) => value !== key)
            : [...selectedValues, key];
        onValueChange(next);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    aria-label={displayText}
                    disabled={disabled || isLoading}
                    className={cn(
                        'flex h-11 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50',
                        selectedLabels.length === 0 && 'text-muted-foreground',
                        className,
                    )}
                >
                    <span className="truncate">{isLoading ? 'Loading…' : displayText}</span>
                    <span className="text-muted-foreground" aria-hidden>
                        ▾
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className={cn('w-full min-w-64 p-2', classNamePopover)} align="start">
                <ul className="max-h-60 space-y-1 overflow-y-auto">
                    {options.map((option) => {
                        const checked = selectedSet.has(option.key);
                        const locked = requiredValues.includes(option.key);

                        return (
                            <li key={option.key}>
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={checked}
                                    disabled={locked}
                                    className={cn(
                                        'flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                                        checked && 'bg-accent/60',
                                        locked && 'cursor-not-allowed opacity-70',
                                    )}
                                    onClick={() => {
                                        toggleValue(option.key);
                                    }}
                                >
                                    <span className="font-medium">{option.label}</span>
                                    {option.description ? (
                                        <span className="text-xs text-muted-foreground">
                                            {option.description}
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
