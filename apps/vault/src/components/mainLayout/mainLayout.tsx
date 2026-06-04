'use client';

import { isIdentityAuthPath } from '@aida/config/public';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header } from './header';
import { Sidebar } from './sidebar';

type MainLayoutProps = {
    children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname();

    if (isIdentityAuthPath(pathname)) {
        return children;
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex min-h-screen flex-col md:flex-row">
                <Sidebar />
                <div className="flex min-h-screen flex-1 flex-col">
                    <Header />
                    <main className="flex-1 p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
