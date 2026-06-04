'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@aida/ui';
import {
    useProjectDocuments,
    useProjectServices,
    useProjectTasks,
    useProjectTools,
} from './hooks/context.hooks';

import { ContextDocumentsTab } from './components/documentsTab';
import { ContextServicesTab } from './components/servicesTab';
import { ContextTasksTab } from './components/tasksTab';
import { ContextToolsTab } from './components/toolsTab';
import { PanelHeader, PanelShell } from '../panelLayout';

type ContextPanelProps = {
    projectId: string;
};

export function ContextPanel({ projectId }: ContextPanelProps) {
    const tasksQuery = useProjectTasks(projectId);
    const documentsQuery = useProjectDocuments(projectId);
    const toolsQuery = useProjectTools(projectId);
    const servicesQuery = useProjectServices(projectId);

    return (
        <PanelShell>
            <Tabs defaultValue="tasks" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PanelHeader className="items-end px-0">
                    <TabsList className="grid h-full w-full grid-cols-4 justify-between rounded-none border-0 bg-transparent p-0">
                        <TabsTrigger
                            value="tasks"
                            className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            Tasks
                        </TabsTrigger>
                        <TabsTrigger
                            value="documents"
                            className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            Documents
                        </TabsTrigger>
                        <TabsTrigger
                            value="tools"
                            className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            Tools
                        </TabsTrigger>
                        <TabsTrigger
                            value="services"
                            className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            Services
                        </TabsTrigger>
                    </TabsList>
                </PanelHeader>

                <TabsContent
                    value="tasks"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <ContextTasksTab
                        tasks={tasksQuery.tasks}
                        isLoading={tasksQuery.isLoading}
                        isError={tasksQuery.isError}
                        errorMessage={tasksQuery.error?.message}
                    />
                </TabsContent>

                <TabsContent
                    value="documents"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <ContextDocumentsTab
                        clientDocuments={documentsQuery.clientDocuments}
                        knowledgeHubs={documentsQuery.knowledgeHubs}
                        isLoading={documentsQuery.isLoading}
                        isError={documentsQuery.isError}
                        errorMessage={documentsQuery.error?.message}
                    />
                </TabsContent>

                <TabsContent
                    value="tools"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <ContextToolsTab
                        tools={toolsQuery.tools}
                        isLoading={toolsQuery.isLoading}
                        isError={toolsQuery.isError}
                        errorMessage={toolsQuery.error?.message}
                    />
                </TabsContent>

                <TabsContent
                    value="services"
                    className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <ContextServicesTab
                        service={servicesQuery.service}
                        isLoading={servicesQuery.isLoading}
                        isError={servicesQuery.isError}
                        errorMessage={servicesQuery.error?.message}
                    />
                </TabsContent>
            </Tabs>
        </PanelShell>
    );
}
