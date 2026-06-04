import { ResizableColumns } from './resizable';
import type { LayoutContentProps } from './types';

// Large screens: 3 resizable columns (jobs | chat | context)
export function LayoutDesktop({
    orgId,
    projectId,
    jobs,
    selectedJob,
    selectedConversation,
}: LayoutContentProps) {
    return (
        <div
            className="hidden min-h-0 w-full min-w-0 flex-1 flex-col lg:flex"
            data-testid="workspace-desktop"
        >
            <ResizableColumns
                orgId={orgId}
                projectId={projectId}
                jobs={jobs}
                selectedJob={selectedJob}
                selectedConversation={selectedConversation}
            />
        </div>
    );
}
