import { createDomainErrorClass } from '@aida/contracts';

export const ConversationActorProfileNotFoundError = createDomainErrorClass<[authUserId: string]>({
    name: 'ConversationActorProfileNotFoundError',
    create: (authUserId) => ({
        message: 'Actor profile not found',
        details: { authUserId },
    }),
});

export const ConversationJobMismatchError = createDomainErrorClass<
    [projectId: string, jobId: string]
>({
    name: 'ConversationJobMismatchError',
    create: (projectId, jobId) => ({
        message: 'Job does not belong to this project',
        details: { projectId, jobId },
    }),
});
