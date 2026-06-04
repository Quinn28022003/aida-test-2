import {
    AppBriefcaseIcon,
    AppHomeIcon,
    AppSettingsIcon,
    AppUsersIcon,
} from '@aida/ui';

import { ROUTE_PATHS } from '@/constants/routePaths';

import type { NavItem } from '../sidebar.types';

export const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Dashboard', href: ROUTE_PATHS.DASHBOARD, icon: AppHomeIcon },
    {
        id: 'projects',
        label: 'Work items',
        resolveHref: 'workItems',
        icon: AppBriefcaseIcon,
    },
    { id: 'team', label: 'Team', href: ROUTE_PATHS.TEAM, icon: AppUsersIcon, comingSoon: true },
    {
        id: 'settings',
        label: 'Settings',
        href: ROUTE_PATHS.SETTINGS,
        icon: AppSettingsIcon,
        comingSoon: true,
    },
];
