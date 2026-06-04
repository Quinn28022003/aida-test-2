import { ApiError } from './apiError';

export function mapDomainError(error: unknown): never {
    if (!(error instanceof Error)) {
        throw error;
    }

    switch (error.name) {
        case 'ProfileNotFoundError':
            throw ApiError.profileNotFound();
        case 'OrganizationNotFoundError':
            throw ApiError.organizationNotFound();
        case 'OrganizationMemberNotFoundError':
            throw ApiError.organizationMemberNotFound();
        case 'ProjectNotFoundError':
            throw ApiError.projectNotFound();
        case 'ProjectMemberNotFoundError':
            throw ApiError.projectMemberNotFound();
        case 'JobNotFoundError':
            throw ApiError.jobNotFound();
        case 'AgentNotFoundError':
            throw ApiError.agentNotFound();
        case 'AgentMemberNotFoundError':
            throw ApiError.agentMemberNotFound();
        case 'AgentMemberAlreadyExistsError':
            throw ApiError.agentMemberAlreadyExists();
        case 'AgentInvitationNotFoundError':
            throw ApiError.agentInvitationNotFound();
        case 'OrganizationAccessDeniedError':
        case 'ProjectAccessDeniedError':
        case 'JobAccessDeniedError':
            throw ApiError.forbidden();
        case 'ProjectActorProfileNotFoundError':
            throw ApiError.profileNotFound();
        default:
            throw error;
    }
}
