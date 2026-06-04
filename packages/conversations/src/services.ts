import type { ConversationsRow } from '@aida/db';
import { JobNotFoundError, ProjectActorProfileNotFoundError, type ProjectsRepository } from '@aida/projects';

import { ConversationJobMismatchError } from './conversations.errors';
import type {
    ConversationsRepository,
    ConversationsService,
    ConversationsSupabaseClient,
    CreateConversationParams,
} from './conversations.types';

export class ConversationUseCaseService implements ConversationsService {
    constructor(
        private readonly supabase: ConversationsSupabaseClient,
        private readonly repository: ConversationsRepository,
        private readonly projectsRepository: ProjectsRepository,
    ) {}

    private async getActorProfileId(actorAuthUserId: string) {
        const actorProfile = await this.projectsRepository.getProfileByAuthUserId({
            client: this.supabase,
            authUserId: actorAuthUserId,
        });

        if (!actorProfile) {
            throw new ProjectActorProfileNotFoundError(actorAuthUserId);
        }

        return actorProfile.id;
    }

    async createConversation({ actorAuthUserId, input }: CreateConversationParams): Promise<ConversationsRow> {
        const actorProfileId = await this.getActorProfileId(actorAuthUserId);
        const job = await this.projectsRepository.getJobById({
            client: this.supabase,
            jobId: input.jobId,
        });

        if (!job) {
            throw new JobNotFoundError(input.jobId);
        }

        if (job.projectId !== input.projectId || job.orgId !== input.orgId) {
            throw new ConversationJobMismatchError(input.projectId, input.jobId);
        }

        const conversation = await this.repository.createConversation({
            client: this.supabase,
            input: {
                orgId: input.orgId,
                projectId: input.projectId,
                jobId: input.jobId,
                title: input.title,
                createdBy: actorProfileId,
            },
        });

        await this.repository.createConversationMember({
            client: this.supabase,
            input: {
                orgId: input.orgId,
                projectId: input.projectId,
                jobId: input.jobId,
                conversationId: conversation.id,
                subjectId: actorProfileId,
                addedBy: actorProfileId,
            },
        });

        return conversation;
    }
}
