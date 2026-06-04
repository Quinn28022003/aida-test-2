import { describe, expect, it, vi } from 'vitest';

import { JobNotFoundError } from '@aida/projects';

import { ConversationJobMismatchError } from './conversations.errors';
import { SupabaseConversationsRepository } from './repositories';
import { ConversationUseCaseService } from './services';
import type { ConversationsSupabaseClient } from './conversations.types';

const supabase = {} as ConversationsSupabaseClient;

describe('ConversationUseCaseService', () => {
    it('creates a conversation and editor membership for the actor', async () => {
        const repository = new SupabaseConversationsRepository();
        const createConversation = vi.spyOn(repository, 'createConversation').mockResolvedValue({
            id: 'conv-1',
            orgId: 'org-1',
            projectId: 'project-1',
            jobId: 'job-1',
            title: 'Tax thread',
            status: 'open',
            priority: 'normal',
            createdBy: 'profile-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            primaryAgentId: null,
            metadata: {},
        });
        const createConversationMember = vi.spyOn(repository, 'createConversationMember').mockResolvedValue({
            id: 'member-1',
            orgId: 'org-1',
            projectId: 'project-1',
            jobId: 'job-1',
            conversationId: 'conv-1',
            subjectType: 'user',
            subjectId: 'profile-1',
            accessLevel: 'editor',
            addedBy: 'profile-1',
            createdAt: '2026-01-01T00:00:00.000Z',
        });

        const projectsRepository = {
            getProfileByAuthUserId: vi.fn().mockResolvedValue({
                id: 'profile-1',
                authUserId: 'auth-user-1',
            }),
            getJobById: vi.fn().mockResolvedValue({
                id: 'job-1',
                orgId: 'org-1',
                projectId: 'project-1',
                title: 'Carly Jones',
            }),
        };

        const service = new ConversationUseCaseService(supabase, repository, projectsRepository as never);

        await expect(
            service.createConversation({
                actorAuthUserId: 'auth-user-1',
                input: {
                    orgId: 'org-1',
                    projectId: 'project-1',
                    jobId: 'job-1',
                    title: 'Tax thread',
                },
            }),
        ).resolves.toEqual(expect.objectContaining({ id: 'conv-1', title: 'Tax thread' }));

        expect(createConversation).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    title: 'Tax thread',
                    createdBy: 'profile-1',
                }),
            }),
        );
        expect(createConversationMember).toHaveBeenCalledWith(
            expect.objectContaining({
                input: expect.objectContaining({
                    conversationId: 'conv-1',
                    subjectId: 'profile-1',
                }),
            }),
        );
    });

    it('throws when the job does not exist', async () => {
        const repository = new SupabaseConversationsRepository();
        const projectsRepository = {
            getProfileByAuthUserId: vi.fn().mockResolvedValue({ id: 'profile-1' }),
            getJobById: vi.fn().mockResolvedValue(null),
        };

        const service = new ConversationUseCaseService(supabase, repository, projectsRepository as never);

        await expect(
            service.createConversation({
                actorAuthUserId: 'auth-user-1',
                input: {
                    orgId: 'org-1',
                    projectId: 'project-1',
                    jobId: 'job-missing',
                    title: 'Tax thread',
                },
            }),
        ).rejects.toBeInstanceOf(JobNotFoundError);
    });

    it('throws when the job does not belong to the project', async () => {
        const repository = new SupabaseConversationsRepository();
        const projectsRepository = {
            getProfileByAuthUserId: vi.fn().mockResolvedValue({ id: 'profile-1' }),
            getJobById: vi.fn().mockResolvedValue({
                id: 'job-1',
                orgId: 'org-1',
                projectId: 'other-project',
            }),
        };

        const service = new ConversationUseCaseService(supabase, repository, projectsRepository as never);

        await expect(
            service.createConversation({
                actorAuthUserId: 'auth-user-1',
                input: {
                    orgId: 'org-1',
                    projectId: 'project-1',
                    jobId: 'job-1',
                    title: 'Tax thread',
                },
            }),
        ).rejects.toBeInstanceOf(ConversationJobMismatchError);
    });
});
