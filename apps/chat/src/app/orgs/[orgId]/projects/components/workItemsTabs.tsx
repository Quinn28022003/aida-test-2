'use client';

import type { ProjectsRow } from '@aida/db';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@aida/ui';
import Link from 'next/link';

import { ROUTE_PATHS } from '@/constants/routePaths';

import { CreateProjectDialog } from './createProjectDialog';

function getProjectProgress(status: 'active' | 'archived') {
    return status === 'active' ? 80 : 20;
}

type WorkItemsTabsProps = {
    orgId: string;
    projects: ProjectsRow[];
};

export function WorkItemsTabs({ orgId, projects }: WorkItemsTabsProps) {
    const [activeTab, setActiveTab] = useState('projects');

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
            <header className="flex h-18 w-full shrink-0 items-end">
                <TabsList className="grid h-full w-full grid-cols-4 justify-between rounded-none border-0 bg-transparent p-0">
                    <TabsTrigger
                        value="projects"
                        className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                        Projects
                    </TabsTrigger>
                    <TabsTrigger
                        value="conversations"
                        className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                        Conversations
                    </TabsTrigger>
                    <TabsTrigger
                        value="recent-documents"
                        className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                        Recent documents
                    </TabsTrigger>
                    <TabsTrigger
                        value="resources"
                        className="h-full w-full rounded-none border-x-0 border-t-0 border-b-2 border-b-transparent bg-transparent px-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:border-x-0 data-[state=active]:border-t-0 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                        Resources
                    </TabsTrigger>
                </TabsList>
            </header>

            <TabsContent value="projects" className="mt-0 space-y-4">
                {projects.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No work items yet</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            This organisation has no projects yet.
                        </CardContent>
                    </Card>
                ) : (
                    projects.map((project) => {
                        const progress = getProjectProgress(project.status);
                        const title = project.name;
                        const subtitle = project.description ?? 'New action items';

                        return (
                        <Link
                            key={project.id}
                            href={ROUTE_PATHS.ProjectWorkspace(orgId, project.id)}
                            className="block rounded-2xl border border-border bg-card p-5 no-underline shadow-sm transition hover:border-primary/40"
                        >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="m-0 text-lg font-semibold text-foreground">{title}</h3>
                                        <p className="m-0 mt-1 text-sm text-muted-foreground">{subtitle}</p>
                                    </div>
                                    <div className="text-sm font-semibold text-muted-foreground">{progress}%</div>
                                </div>
                            </Link>
                        );
                    })
                )}
                {activeTab === 'projects' ? <CreateProjectDialog orgId={orgId} /> : null}
            </TabsContent>
        </Tabs>
    );
}
