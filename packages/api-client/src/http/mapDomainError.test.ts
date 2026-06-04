import { describe, expect, it } from 'vitest';

import { ApiError } from './apiError';
import { mapDomainError } from './mapDomainError';

function createDomainError(name: string) {
    const error = new Error(`${name} message`);
    error.name = name;

    return error;
}

describe('mapDomainError', () => {
    it.each([
        ['ProfileNotFoundError', 'profile.not_found', 404, 'Profile not found'],
        ['OrganizationNotFoundError', 'org.not_found', 404, 'Organisation not found'],
        ['OrganizationMemberNotFoundError', 'org.member.not_found', 404, 'Organisation member not found'],
        ['ProjectNotFoundError', 'project.not_found', 404, 'Project not found'],
        ['ProjectMemberNotFoundError', 'project.member.not_found', 404, 'Project member not found'],
        ['JobNotFoundError', 'job.not_found', 404, 'Job not found'],
        ['AgentNotFoundError', 'agent.not_found', 404, 'Agent not found'],
        ['AgentMemberNotFoundError', 'agent.member.not_found', 404, 'Agent member not found'],
        ['AgentMemberAlreadyExistsError', 'agent.member.already_exists', 409, 'Agent member already exists'],
        ['AgentInvitationNotFoundError', 'agent.invitation.not_found', 404, 'Agent invitation not found'],
        ['OrganizationAccessDeniedError', 'auth.forbidden', 403, 'Forbidden'],
        ['ProjectAccessDeniedError', 'auth.forbidden', 403, 'Forbidden'],
        ['JobAccessDeniedError', 'auth.forbidden', 403, 'Forbidden'],
    ])('maps %s to the expected ApiError', (errorName, code, status, message) => {
        const error = createDomainError(errorName);

        try {
            mapDomainError(error);
            throw new Error('Expected mapDomainError to throw');
        } catch (mappedError) {
            expect(mappedError).toBeInstanceOf(ApiError);
            expect(mappedError).toMatchObject({
                code,
                status,
                message,
            });
        }
    });

    it('rethrows unknown errors unchanged', () => {
        const error = createDomainError('UnexpectedDomainError');

        expect(() => mapDomainError(error)).toThrow(error);
    });

    it('rethrows non-Error values unchanged', () => {
        const error = { name: 'ProfileNotFoundError' };

        expect(() => mapDomainError(error)).toThrow(error);
    });
});
