import type {
    TaskItem,
    ProjectDocuments,
    ToolItem,
    ServiceItem,
} from '../types/context.types';

export class ProjectTasksService {
    static async list(_projectId: string): Promise<TaskItem[]> {
        void _projectId;
        return [];
    }
}

export class ProjectDocumentsService {
    static async list(_projectId: string): Promise<ProjectDocuments> {
        void _projectId;
        return {
            clientDocuments: [],
            knowledgeHubs: [],
        };
    }
}

export class ProjectToolsService {
    static async list(_projectId: string): Promise<ToolItem[]> {
        void _projectId;
        return [];
    }
}

export class ProjectServicesService {
    static async get(_projectId: string): Promise<ServiceItem | null> {
        void _projectId;
        return null;
    }
}
