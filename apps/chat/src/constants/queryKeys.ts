export const authSessionQueryKey = ['auth', 'session'] as const;

export const profileQueryKey = ['profile'] as const;
export const meContextQueryKey = ['chat', 'me-context'] as const;
export const orgProjectsQueryKey = (orgId: string) => ['chat', 'org-projects', orgId] as const;
export const projectJobsQueryKey = (projectId: string) => ['chat', 'project-jobs', projectId] as const;
export const projectJobMembersQueryKey = (projectId: string, jobId: string) =>
    ['chat', 'project-job-members', projectId, jobId] as const;
export const projectMembersQueryKey = (projectId: string) => ['chat', 'project-members', projectId] as const;
export const projectAgentsQueryKey = (projectId: string) => ['chat', 'project-agents', projectId] as const;
export const projectTasksQueryKey = (projectId: string) => ['chat', 'project-tasks', projectId] as const;
export const projectDocumentsQueryKey = (projectId: string) => ['chat', 'project-documents', projectId] as const;
export const projectToolsQueryKey = (projectId: string) => ['chat', 'project-tools', projectId] as const;
export const projectServicesQueryKey = (projectId: string) => ['chat', 'project-services', projectId] as const;
