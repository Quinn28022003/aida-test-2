export type TaskItem = {
    id: string;
    title: string;
    dueLabel: string;
    progress: number;
    status: 'in_progress' | 'pending';
};

export type DocumentItem = {
    id: string;
    title: string;
    metadata: string;
};

export type ToolItem = {
    id: string;
    title: string;
    description: string;
    tone: 'blue' | 'green' | 'purple';
};

export type ProjectDocuments = {
    clientDocuments: DocumentItem[];
    knowledgeHubs: DocumentItem[];
};

export type ServiceItem = {
    id: string;
    logoLetter: string;
    name: string;
    description: string;
};
