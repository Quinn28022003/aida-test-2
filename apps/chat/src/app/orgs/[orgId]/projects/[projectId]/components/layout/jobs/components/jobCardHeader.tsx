'use client';

import type { JobsRow } from '@aida/db';
import { cn } from '@aida/ui';

type JobCardHeaderProps = {
    job: JobsRow;
    active: boolean;
    actions?: React.ReactNode;
};

export function JobCardHeader({ job, active, actions }: JobCardHeaderProps) {
    return (
        <>
            <div className="flex items-start justify-between gap-2">
                <p
                    className={cn(
                        'm-0 text-[11px] font-semibold uppercase tracking-[0.14em]',
                        active ? 'text-primary' : 'text-muted-foreground',
                    )}
                >
                    Client
                </p>
                {actions}
            </div>

            <p className="m-0 mt-2 text-lg font-semibold leading-tight text-foreground">{job.title}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
                {`${job.status.charAt(0).toUpperCase()}${job.status.slice(1)} job in progress.`}
            </p>
        </>
    );
}
