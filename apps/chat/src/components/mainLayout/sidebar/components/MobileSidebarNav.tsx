'use client';

import { NAV_ITEMS } from '../constants/nav.constants';
import { SidebarNavItem } from './SidebarNavItem';

interface MobileSidebarNavProps {
    pathname: string;
}

export function MobileSidebarNav({ pathname }: MobileSidebarNavProps) {
    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card px-3 py-2 md:hidden"
            aria-label="Mobile navigation"
        >
            {NAV_ITEMS.map((item) => (
                <SidebarNavItem key={item.id} item={item} pathname={pathname} variant="mobile" />
            ))}
        </nav>
    );
}
