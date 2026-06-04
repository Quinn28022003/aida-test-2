import { Button, ShareIcon, Skeleton } from '@aida/ui';

import { PanelBody } from '../../panelLayout';
import type { ServiceItem } from '../types/context.types';

type ContextServicesTabProps = {
    service: ServiceItem | null;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
};

export function ContextServicesTab({
    service,
    isLoading = false,
    isError = false,
    errorMessage,
}: ContextServicesTabProps) {
    return (
        <PanelBody className="flex flex-col items-center justify-center px-5 py-8 text-center">
            {isLoading && (
                <div className="flex w-full flex-col items-center text-center">
                    <Skeleton className="size-16 rounded-2xl" />
                    <Skeleton className="mt-5 h-6 w-48" />
                    <Skeleton className="mt-3 h-4 w-64" />
                    <Skeleton className="mt-3 h-4 w-56" />
                    <Skeleton className="mt-6 h-10 w-40 rounded-md" />
                </div>
            )}

            {!isLoading && isError && (
                <p className="m-0 text-sm text-destructive">
                    {errorMessage ?? 'We could not load services.'}
                </p>
            )}

            {!isLoading && !isError && !service && (
                <p className="m-0 text-sm text-muted-foreground">No services yet.</p>
            )}

            {!isLoading && !isError && service && (
                <>
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                        {service.logoLetter}
                    </span>
                    <h3 className="m-0 mt-5 text-lg font-semibold text-foreground">{service.name}</h3>
                    <p className="m-0 mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                    </p>
                    <Button type="button" className="mt-6">
                        <ShareIcon className="mr-2 size-4" />
                        Send to friend
                    </Button>
                </>
            )}
        </PanelBody>
    );
}
