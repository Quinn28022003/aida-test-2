'use client';

import { useQuery } from '@tanstack/react-query';

import {
    projectTasksQueryKey,
    projectDocumentsQueryKey,
    projectToolsQueryKey,
    projectServicesQueryKey,
} from '@/constants/queryKeys';
import { useMeContext } from '@/hooks/me';
import type { ProjectDocuments } from '../types/context.types';
import {
    ProjectTasksService,
    ProjectDocumentsService,
    ProjectToolsService,
    ProjectServicesService,
} from '../services/context.services';

const emptyDocuments: ProjectDocuments = {
    clientDocuments: [],
    knowledgeHubs: [],
};

export function useProjectTasks(projectId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: projectTasksQueryKey(projectId),
        queryFn: () => ProjectTasksService.list(projectId),
        enabled: Boolean(projectId) && meContext.isSuccess,
    });

    return {
        ...query,
        tasks: query.data ?? [],
    };
}

export function useProjectDocuments(projectId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: projectDocumentsQueryKey(projectId),
        queryFn: () => ProjectDocumentsService.list(projectId),
        enabled: Boolean(projectId) && meContext.isSuccess,
    });

    return {
        ...query,
        clientDocuments: query.data?.clientDocuments ?? emptyDocuments.clientDocuments,
        knowledgeHubs: query.data?.knowledgeHubs ?? emptyDocuments.knowledgeHubs,
    };
}

export function useProjectTools(projectId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: projectToolsQueryKey(projectId),
        queryFn: () => ProjectToolsService.list(projectId),
        enabled: Boolean(projectId) && meContext.isSuccess,
    });

    return {
        ...query,
        tools: query.data ?? [],
    };
}

export function useProjectServices(projectId: string) {
    const meContext = useMeContext();
    const query = useQuery({
        queryKey: projectServicesQueryKey(projectId),
        queryFn: () => ProjectServicesService.get(projectId),
        enabled: Boolean(projectId) && meContext.isSuccess,
    });

    return {
        ...query,
        service: query.data ?? null,
    };
}
