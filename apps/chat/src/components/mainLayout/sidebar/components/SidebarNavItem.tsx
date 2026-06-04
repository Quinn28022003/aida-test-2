'use client';

import Link from 'next/link';
import { cn } from '@aida/ui';

import { getNavItemHref, isNavItemActive } from '../lib/nav';
import type { NavItem } from '../sidebar.types';

interface SidebarNavItemProps {
    item: NavItem;
    pathname: string;
    variant: 'desktop' | 'mobile';
}

export function SidebarNavItem({ item, pathname, variant }: SidebarNavItemProps) {
    const href = getNavItemHref(item);
    const active = isNavItemActive(pathname, item);
    const Icon = item.icon;

    if (variant === 'desktop') {
        const className = cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors 2xl:h-10 2xl:w-full 2xl:justify-start 2xl:gap-3 2xl:px-3',
            active
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            item.comingSoon && 'cursor-default opacity-70',
        );

        if (item.comingSoon) {
            return (
                <span
                    key={item.id}
                    className={className}
                    title={`${item.label} (coming soon)`}
                    aria-disabled="true"
                >
                    <Icon />
                    <span className="sr-only">{item.label}</span>
                    <span className="hidden text-sm font-medium 2xl:inline">{item.label}</span>
                </span>
            );
        }

        return (
            <Link
                key={item.id}
                href={href}
                className={className}
                aria-current={active ? 'page' : undefined}
                title={item.label}
            >
                <Icon />
                <span className="sr-only">{item.label}</span>
                <span className="hidden text-sm font-medium 2xl:inline">{item.label}</span>
            </Link>
        );
    }

    // mobile variant
    const className = cn(
        'flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs transition-colors',
        active ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        item.comingSoon && 'cursor-default opacity-70',
    );

    if (item.comingSoon) {
        return (
            <span
                key={item.id}
                className={className}
                title={`${item.label} (coming soon)`}
                aria-disabled="true"
            >
                <Icon />
                <span>{item.label}</span>
            </span>
        );
    }

    return (
        <Link
            key={item.id}
            href={href}
            className={className}
            aria-current={active ? 'page' : undefined}
            title={item.label}
        >
            <Icon />
            <span>{item.label}</span>
        </Link>
    );
}
