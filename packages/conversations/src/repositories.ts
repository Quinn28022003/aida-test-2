import {
    conversationMembersRowSchema,
    conversationsRowSchema,
    parseDatabaseRow,
    type ConversationMembersRow,
    type ConversationsRow,
} from '@aida/db';

import type {
    ConversationsRepository,
    CreateConversationMemberRepositoryInput,
    CreateConversationRepositoryInput,
} from './conversations.types';

export class SupabaseConversationsRepository implements ConversationsRepository {
    async createConversation({
        client: supabase,
        input,
    }: {
        client: Parameters<ConversationsRepository['createConversation']>[0]['client'];
        input: CreateConversationRepositoryInput;
    }): Promise<ConversationsRow> {
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                org_id: input.orgId,
                project_id: input.projectId,
                job_id: input.jobId,
                title: input.title,
                created_by: input.createdBy,
                status: 'open',
                priority: 'normal',
                primary_agent_id: null,
                metadata: {},
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return parseDatabaseRow(data, conversationsRowSchema);
    }

    async createConversationMember({
        client: supabase,
        input,
    }: {
        client: Parameters<ConversationsRepository['createConversationMember']>[0]['client'];
        input: CreateConversationMemberRepositoryInput;
    }): Promise<ConversationMembersRow> {
        const { data, error } = await supabase
            .from('conversation_members')
            .insert({
                org_id: input.orgId,
                project_id: input.projectId,
                job_id: input.jobId,
                conversation_id: input.conversationId,
                subject_type: 'user',
                subject_id: input.subjectId,
                access_level: 'editor',
                added_by: input.addedBy,
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return parseDatabaseRow(data, conversationMembersRowSchema);
    }
}
