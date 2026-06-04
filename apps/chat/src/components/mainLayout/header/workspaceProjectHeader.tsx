'use client';

import { ArrowLeftIcon, MoreVerticalIcon, SearchIcon } from '@aida/ui';
import Link from 'next/link';

import { ROUTE_PATHS } from '@/constants/routePaths';
import { useMeContext } from '@/hooks/me';

type WorkspaceProjectHeaderProps = {
    orgId: string;
    projectId: string;
};

const headerIconButtonClassName =
    'flex shrink-0 items-center justify-center p-1 text-muted-foreground transition hover:text-foreground';

export function WorkspaceProjectHeader({ orgId, projectId }: WorkspaceProjectHeaderProps) {
    const meContext = useMeContext();
    const project = meContext.scoped?.projects.find((item) => item.id === projectId);
    const projectName = project?.name ?? 'Chat Workspace';

    return (
        <>
            <Link
                href={ROUTE_PATHS.OrgProjects(orgId)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground no-underline transition hover:border-primary/40 hover:text-foreground"
                aria-label="Back to projects"
            >
                <ArrowLeftIcon />
            </Link>
            <h1 className="m-0 min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
                {projectName}
            </h1>
            <button type="button" className={headerIconButtonClassName} aria-label="Search">
                <SearchIcon className="size-6" />
            </button>
            <button type="button" className={headerIconButtonClassName} aria-label="More options">
                <MoreVerticalIcon className="size-6" />
            </button>
        </>
    );
}
