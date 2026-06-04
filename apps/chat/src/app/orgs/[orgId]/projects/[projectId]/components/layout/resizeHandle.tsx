'use client';

import { cn } from '@aida/ui';
import { Separator } from 'react-resizable-panels';

export function ResizeHandle() {
    return (
        <Separator
            className={cn(
                'group relative z-10 w-px shrink-0 self-stretch overflow-visible bg-transparent p-0 outline-none',
                'before:absolute before:inset-y-0 before:-left-1.5 before:z-0 before:w-4 before:content-[""]',
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'pointer-events-none absolute inset-y-0 left-1/2 z-0 w-px -translate-x-1/2 rounded-sm bg-aida-accent-soft opacity-0',
                    'transition-[width,opacity] duration-150 ease-out',
                    'group-hover:w-3 group-hover:opacity-100',
                    'group-data-[separator=active]:w-3 group-data-[separator=active]:opacity-100 group-data-[separator=focus]:w-3 group-data-[separator=focus]:opacity-100',
                )}
            />
            <span
                aria-hidden
                className={cn(
                    'pointer-events-none absolute inset-y-0 left-1/2 z-1 w-px -translate-x-1/2 rounded-full bg-border',
                    'transition-[width,background-color] duration-150 ease-out',
                    'group-hover:w-1 group-hover:bg-primary',
                    'group-data-[separator=active]:w-1 group-data-[separator=active]:bg-primary group-data-[separator=active]:opacity-100 group-data-[separator=focus]:w-1 group-data-[separator=focus]:bg-primary group-data-[separator=focus]:opacity-100',
                )}
            />
        </Separator>
    );
}
