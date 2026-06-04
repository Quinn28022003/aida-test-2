import { Tabs, TabsContent, TabsList, TabsTrigger } from '@aida/ui';

import { ChatPanel } from './chat';
import { ContextPanel } from './context';
import { JobsPanel } from './jobs';
import type { LayoutContentProps } from './types';

// Small screens: one panel at a time via tabs
export function LayoutMobile({
    orgId,
    projectId,
    jobs,
    selectedJob,
    selectedConversation,
}: LayoutContentProps) {
    return (
        <div
            className="flex min-h-0 flex-1 flex-col px-4 pb-24 md:px-6 lg:hidden"
            data-testid="workspace-mobile"
        >
            <Tabs defaultValue="chat" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="mt-4 w-full shrink-0">
                    <TabsTrigger value="jobs" className="flex-1">
                        Jobs
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex-1">
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex-1">
                        Tasks
                    </TabsTrigger>
                </TabsList>
                <TabsContent
                    value="jobs"
                    className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                    <JobsPanel
                        orgId={orgId}
                        projectId={projectId}
                        jobs={jobs}
                        selectedJob={selectedJob}
                        selectedConversationId={selectedConversation?.id}
                    />
                </TabsContent>
                <TabsContent
                    value="chat"
                    className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                    <ChatPanel
                        selectedJob={selectedJob}
                        selectedConversation={selectedConversation}
                    />
                </TabsContent>
                <TabsContent
                    value="tasks"
                    className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                    <ContextPanel projectId={projectId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
