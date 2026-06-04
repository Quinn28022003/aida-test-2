'use client';

import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from './constants/nav.constants';
import { getNavItemHref, isNavItemActive, buildProfileInitials } from './lib/nav';
import { useProfile } from '@/hooks/profile';
import { useAuth } from '@/lib/auth/session';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileSidebarNav } from './components/MobileSidebarNav';

export { NAV_ITEMS, getNavItemHref, isNavItemActive, buildProfileInitials };
export { DesktopSidebar, MobileSidebarNav };

export function Sidebar() {
    const pathname = usePathname();
    const { data: user } = useProfile();
    const { status } = useAuth();
    const profileLabel = user?.displayName ?? user?.email ?? 'Signed in';

    return (
        <>
            <DesktopSidebar pathname={pathname} profileLabel={profileLabel} authStatus={status} />
            <MobileSidebarNav pathname={pathname} />
        </>
    );
}
