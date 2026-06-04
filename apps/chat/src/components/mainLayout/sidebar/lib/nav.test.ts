import { describe, expect, it } from 'vitest';

import { NAV_ITEMS } from '../constants/nav.constants';
import { isNavItemActive } from './nav';

const workItemsItem = NAV_ITEMS.find((item) => item.id === 'projects')!;
const dashboardItem = NAV_ITEMS.find((item) => item.id === 'home')!;
const settingsItem = NAV_ITEMS.find((item) => item.id === 'settings')!;

describe('isNavItemActive', () => {
    it('activates dashboard for the dashboard route', () => {
        expect(isNavItemActive('/dashboard', dashboardItem)).toBe(true);
    });

    it('activates work items for the org picker route', () => {
        expect(isNavItemActive('/orgs', workItemsItem)).toBe(true);
    });

    it('activates work items for the org projects list route', () => {
        expect(isNavItemActive('/orgs/org-1/projects', workItemsItem)).toBe(true);
    });

    it('activates work items for project workspace routes', () => {
        expect(isNavItemActive('/orgs/org-1/projects/proj-1', workItemsItem)).toBe(true);
    });

    it('handles project workspace routes with query strings', () => {
        expect(isNavItemActive('/orgs/org-1/projects/proj-1?jobId=job-1', workItemsItem)).toBe(true);
    });

    it('does not activate work items for organisation routes', () => {
        expect(isNavItemActive('/orgs/org-1', workItemsItem)).toBe(false);
    });

    it('does not activate work items for routes outside the sidebar segments', () => {
        expect(isNavItemActive('/tools/tool-1', workItemsItem)).toBe(false);
    });

    it('keeps prefix matching for settings routes', () => {
        expect(isNavItemActive('/settings/profile?q=test', settingsItem)).toBe(true);
    });

    it('strips query strings before matching dashboard routes', () => {
        expect(isNavItemActive('/dashboard?x=1', dashboardItem)).toBe(true);
    });
});
