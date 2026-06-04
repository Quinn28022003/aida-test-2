'use client';

import { Group, Panel } from 'react-resizable-panels';

import { ChatPanel } from './chat';
import { ContextPanel } from './context';
import { JobsPanel } from './jobs';
import type { LayoutContentProps } from './types';
import { ResizeHandle } from './resizeHandle';

export function ResizableColumns({
    orgId,
    projectId,
    jobs,
    selectedJob,
    selectedConversation,
}: LayoutContentProps) {
    return (
        <Group orientation="horizontal" className="relative h-full min-h-0 w-full flex-1">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-1 border-b border-border"
                style={{ top: '4.5rem' }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-1 border-t border-border"
                style={{ bottom: '4.5rem' }}
            />

            <Panel id="workspace-jobs" defaultSize={22} minSize={18} className="h-full min-w-0 overflow-hidden">
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                    <JobsPanel
                        orgId={orgId}
                        projectId={projectId}
                        jobs={jobs}
                        selectedJob={selectedJob}
                        selectedConversationId={selectedConversation?.id}
                    />
                </div>
            </Panel>

            <ResizeHandle />

            <Panel id="workspace-chat" defaultSize={46} minSize={28} className="h-full min-w-0 overflow-hidden">
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                    <ChatPanel
                        selectedJob={selectedJob}
                        selectedConversation={selectedConversation}
                    />
                </div>
            </Panel>

            <ResizeHandle />

            <Panel id="workspace-context" defaultSize={32} minSize={22} className="h-full min-w-0 overflow-hidden">
                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                    <ContextPanel projectId={projectId} />
                </div>
            </Panel>
        </Group>
    );
}
