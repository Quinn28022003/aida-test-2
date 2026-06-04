'use client';

import Link from 'next/link';

import { NAV_ITEMS } from '../constants/nav.constants';
import { ROUTE_PATHS } from '@/constants/routePaths';
import type { useAuth } from '@/lib/auth/session';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarProfileMenu } from './SidebarProfileMenu';

interface DesktopSidebarProps {
    pathname: string;
    profileLabel: string;
    authStatus: ReturnType<typeof useAuth>['status'];
}

export function DesktopSidebar({ pathname, profileLabel, authStatus }: DesktopSidebarProps) {
    return (
        <aside
            className="hidden w-20 shrink-0 flex-col items-center border-r border-border bg-card py-4 md:flex 2xl:w-64 2xl:items-stretch 2xl:px-3"
            aria-label="Sidebar navigation"
        >
            <Link
                href={ROUTE_PATHS.DASHBOARD}
                className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-primary no-underline 2xl:h-10 2xl:w-auto 2xl:justify-start 2xl:px-3"
                aria-label="Aida home"
            >
                <span className="inline 2xl:hidden">A</span>
                <span className="hidden text-base tracking-tight 2xl:inline">AiDA</span>
            </Link>

            <nav className="flex flex-1 flex-col items-center gap-3 2xl:items-stretch 2xl:gap-2" aria-label="Primary">
                {NAV_ITEMS.map((item) => (
                    <SidebarNavItem key={item.id} item={item} pathname={pathname} variant="desktop" />
                ))}
            </nav>

            <SidebarProfileMenu profileLabel={profileLabel} authStatus={authStatus} />
        </aside>
    );
}
