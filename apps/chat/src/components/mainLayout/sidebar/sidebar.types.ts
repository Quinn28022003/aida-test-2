import type { ComponentType, SVGProps } from 'react';

export type NavIconProps = SVGProps<SVGSVGElement>;

export type NavItem = {
    id: string;
    label: string;
    href?: string;
    resolveHref?: 'workItems';
    icon: ComponentType<NavIconProps>;
    /** Shown when the route is not implemented yet. */
    comingSoon?: boolean;
};
