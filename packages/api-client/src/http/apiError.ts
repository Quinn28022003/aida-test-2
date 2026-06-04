import type { ApiErrorCode } from '@aida/contracts';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ApiError extends Error {
    readonly code: ApiErrorCode;

    readonly status: ContentfulStatusCode;

    readonly details?: Record<string, unknown>;

    constructor(
        code: ApiErrorCode,
        status: ContentfulStatusCode,
        message: string,
        details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }

    static unauthenticated(message = 'Authentication required') {
        return new ApiError('auth.unauthenticated', 401, message);
    }

    static forbidden(message = 'Forbidden') {
        return new ApiError('auth.forbidden', 403, message);
    }

    static badRequest(message = 'Request validation failed', details?: Record<string, unknown>) {
        return new ApiError('request.invalid', 400, message, details);
    }

    static profileNotFound(message = 'Profile not found') {
        return new ApiError('profile.not_found', 404, message);
    }

    static organizationNotFound(message = 'Organisation not found') {
        return new ApiError('org.not_found', 404, message);
    }

    static organizationMemberNotFound(message = 'Organisation member not found') {
        return new ApiError('org.member.not_found', 404, message);
    }

    static projectNotFound(message = 'Project not found') {
        return new ApiError('project.not_found', 404, message);
    }

    static projectMemberNotFound(message = 'Project member not found') {
        return new ApiError('project.member.not_found', 404, message);
    }

    static jobNotFound(message = 'Job not found') {
        return new ApiError('job.not_found', 404, message);
    }

    static agentNotFound(message = 'Agent not found') {
        return new ApiError('agent.not_found', 404, message);
    }

    static agentMemberNotFound(message = 'Agent member not found') {
        return new ApiError('agent.member.not_found', 404, message);
    }

    static agentMemberAlreadyExists(message = 'Agent member already exists') {
        return new ApiError('agent.member.already_exists', 409, message);
    }

    static agentInvitationNotFound(message = 'Agent invitation not found') {
        return new ApiError('agent.invitation.not_found', 404, message);
    }
}
