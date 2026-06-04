'use client';

import { isIdentityAuthPath } from '@aida/config/public';
import { cn } from '@aida/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header } from './header';
import { Sidebar } from './sidebar';

function isChatWorkspacePath(pathname: string) {
    return /^\/orgs\/[^/]+\/projects\/[^/]+$/.test(pathname);
}

type MainLayoutProps = {
    children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname();
    const isChatWorkspace = isChatWorkspacePath(pathname);

    if (isIdentityAuthPath(pathname)) {
        return children;
    }

    return (
        <div
            className={cn(
                'flex bg-background text-foreground',
                isChatWorkspace ? 'h-screen overflow-hidden' : 'min-h-screen',
            )}
        >
            <Sidebar />

            <div
                className={cn(
                    'flex min-w-0 flex-1 flex-col',
                    isChatWorkspace ? 'h-full min-h-0 overflow-hidden' : 'min-h-screen',
                )}
            >
                <Header />
                <main
                    className={cn(
                        'flex min-h-0 flex-1 flex-col',
                        isChatWorkspace ? 'overflow-hidden p-0' : 'overflow-auto p-4 pb-24 md:p-6 md:pb-6',
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
