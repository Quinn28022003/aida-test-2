import type { ConversationMembersRow, ConversationsRow, Database } from '@aida/db';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ConversationsSupabaseClient = SupabaseClient<Database>;

export type CreateConversationRepositoryInput = {
    orgId: string;
    projectId: string;
    jobId: string;
    title: string;
    createdBy: string;
};

export type CreateConversationMemberRepositoryInput = {
    orgId: string;
    projectId: string;
    jobId: string;
    conversationId: string;
    subjectId: string;
    addedBy: string;
};

export type ConversationsRepository = {
    createConversation(params: {
        client: ConversationsSupabaseClient;
        input: CreateConversationRepositoryInput;
    }): Promise<ConversationsRow>;
    createConversationMember(params: {
        client: ConversationsSupabaseClient;
        input: CreateConversationMemberRepositoryInput;
    }): Promise<ConversationMembersRow>;
};

export type CreateConversationInput = {
    orgId: string;
    projectId: string;
    jobId: string;
    title: string;
};

export type CreateConversationParams = {
    actorAuthUserId: string;
    input: CreateConversationInput;
};

export type ConversationsService = {
    createConversation(params: CreateConversationParams): Promise<ConversationsRow>;
};
