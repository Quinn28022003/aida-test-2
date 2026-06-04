'use client';

import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useMeContext } from '@/hooks/me';

import { getHeaderConfig, getWorkspaceRouteParams } from './lib/header';
import { WorkspaceProjectHeader } from './workspaceProjectHeader';

export function Header() {
    const pathname = usePathname();
    const params = useParams<{ orgId?: string; projectId?: string }>();
    const meContext = useMeContext();
    const config = useMemo(() => getHeaderConfig(pathname), [pathname]);
    const workspaceRoute = useMemo(
        () => getWorkspaceRouteParams(pathname, params),
        [pathname, params],
    );

    const orgTitle = useMemo(() => {
        const orgMatch = pathname.match(/^\/orgs\/([^/]+)$/);
        if (!orgMatch) {
            return null;
        }

        const orgId = params.orgId ?? orgMatch[1];
        return meContext.scoped?.organizations.find((organization) => organization.id === orgId)?.name ?? config.title;
    }, [config.title, meContext.scoped?.organizations, params.orgId, pathname]);

    if (workspaceRoute) {
        return (
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
                <WorkspaceProjectHeader orgId={workspaceRoute.orgId} projectId={workspaceRoute.projectId} />
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-border bg-card px-4 md:px-6">
            <h1 className="m-0 truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
                {orgTitle ?? config.title}
            </h1>
        </header>
    );
}
