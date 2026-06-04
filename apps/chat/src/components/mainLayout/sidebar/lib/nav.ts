import { ROUTE_PATHS } from '@/constants/routePaths';

import type { NavItem } from '../sidebar.types';

/**
 * Gets the href for a nav item.
 * If the item has `resolveHref: 'workItems'`, returns the orgs route.
 * Otherwise returns the item's href or defaults to dashboard.
 */
export function getNavItemHref(item: NavItem): string {
    if (item.resolveHref === 'workItems') {
        return ROUTE_PATHS.ORGS;
    }

    return item.href ?? ROUTE_PATHS.DASHBOARD;
}

/**
 * Builds profile initials from a label string.
 * - Returns '??' for empty strings
 * - For multi-word labels, returns first letter of first two words (e.g., "John Doe" -> "JD")
 * - For single-word labels, returns first 2 characters (e.g., "John" -> "JO")
 */
export function buildProfileInitials(label: string): string {
    const trimmed = label.trim();

    if (!trimmed) {
        return '??';
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }

    return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Normalizes a pathname by:
 * - Removing query strings and hash fragments
 * - Trailing slashes (except for root '/')
 */
function normalizePath(pathname: string): string {
    const path = pathname.split(/[?#]/)[0] || '/';

    if (path === '/') {
        return path;
    }

    return path.replace(/\/+$/, '');
}

/**
 * Checks if a pathname matches or starts with a given href.
 * Used to determine if a nav item is active for nested routes.
 */
function isPathActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Checks if the current path is a work items route.
 * Matches: /orgs or /orgs/:orgId/projects/*
 */
function isWorkItemsRoute(pathname: string): boolean {
    const path = normalizePath(pathname);
    return path === ROUTE_PATHS.ORGS || /^\/orgs\/[^/]+\/projects(\/|$)/.test(path);
}

/**
 * Determines whether a nav item should show the active (selected) style.
 * Handles special case for 'workItems' resolveHref and regular href matching.
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
    const currentPath = normalizePath(pathname);

    if (item.resolveHref === 'workItems') {
        return isWorkItemsRoute(currentPath);
    }

    const targetPath = normalizePath(item.href ?? '/');

    if (targetPath === '/') {
        return currentPath === '/';
    }

    return isPathActive(currentPath, targetPath);
}
