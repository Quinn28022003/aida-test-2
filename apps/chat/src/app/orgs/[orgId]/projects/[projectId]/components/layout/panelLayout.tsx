import { cn, ScrollArea } from '@aida/ui';
import type { ReactNode } from 'react';

/** Fixed chrome heights keep header/footer borders aligned across resizable panels. */
export const PANEL_HEADER_CLASS = 'h-[4.5rem] shrink-0 px-5';
export const PANEL_FOOTER_CLASS = 'h-[4.5rem] shrink-0 px-4';

type PanelChromeProps = {
    children: ReactNode;
    className?: string;
};

type PanelBodyProps = PanelChromeProps & {
    scrollable?: boolean;
};

export function PanelShell({ children, className }: PanelChromeProps) {
    return (
        <div className={cn('flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card', className)}>{children}</div>
    );
}

export function PanelHeader({ children, className }: PanelChromeProps) {
    return (
        <header className={cn(PANEL_HEADER_CLASS, 'flex min-w-0 items-center', className)}>{children}</header>
    );
}

export function PanelBody({ children, className, scrollable = false }: PanelBodyProps) {
    if (scrollable) {
        return (
            <div className="h-0 min-h-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full">
                    <div className={className}>{children}</div>
                </ScrollArea>
            </div>
        );
    }

    return <div className={cn('min-h-0 flex-1 overflow-y-auto', className)}>{children}</div>;
}

export function PanelFooter({ children, className }: PanelChromeProps) {
    return (
        <footer className={cn(PANEL_FOOTER_CLASS, 'flex min-w-0 items-center', className)}>{children}</footer>
    );
}
