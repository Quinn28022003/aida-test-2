import type { ConversationsRow, JobsRow } from '@aida/db';

export type LayoutContentProps = {
    orgId: string;
    projectId: string;
    jobs: JobsRow[];
    selectedJob: JobsRow | undefined;
    selectedConversation: ConversationsRow | undefined;
};
