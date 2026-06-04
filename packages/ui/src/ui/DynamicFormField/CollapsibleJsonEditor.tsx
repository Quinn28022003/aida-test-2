'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import * as React from 'react';

import { cn } from '../../lib/cn';
import { Textarea } from '../textarea';

type CollapsibleJsonEditorProps = {
    label: string;
    value: unknown;
    onChange: (value: unknown) => void;
    placeholder?: string;
    rows?: number;
    defaultOpen?: boolean;
    disabled?: boolean;
};

function formatJsonValue(value: unknown): string {
    if (value === undefined || value === null) {
        return '';
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '';
    }
}

export function CollapsibleJsonEditor({
    label,
    value,
    onChange,
    placeholder = '{}',
    rows = 6,
    defaultOpen = false,
    disabled = false,
}: CollapsibleJsonEditorProps) {
    const [open, setOpen] = React.useState(defaultOpen);
    const [text, setText] = React.useState(() => formatJsonValue(value));

    React.useEffect(() => {
        setText(formatJsonValue(value));
    }, [value]);

    return (
        <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
            <CollapsiblePrimitive.Trigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled}
                >
                    {label}
                    <span className="text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
                </button>
            </CollapsiblePrimitive.Trigger>
            <CollapsiblePrimitive.Content className="pt-2">
                <Textarea
                    value={text}
                    placeholder={placeholder}
                    rows={rows}
                    disabled={disabled}
                    className={cn('font-mono text-sm')}
                    onChange={(event) => {
                        const nextText = event.target.value;
                        setText(nextText);

                        if (!nextText.trim()) {
                            onChange(undefined);
                            return;
                        }

                        try {
                            onChange(JSON.parse(nextText) as unknown);
                        } catch {
                            // Keep draft text; validation can surface via schema.
                        }
                    }}
                />
            </CollapsiblePrimitive.Content>
        </CollapsiblePrimitive.Root>
    );
}
