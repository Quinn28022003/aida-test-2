import { describe, expect, it } from 'vitest';

import { ApiError } from './apiError';

describe('ApiError', () => {
    it('unauthenticated uses default message and status', () => {
        const error = ApiError.unauthenticated();

        expect(error).toBeInstanceOf(ApiError);
        expect(error.name).toBe('ApiError');
        expect(error.code).toBe('auth.unauthenticated');
        expect(error.status).toBe(401);
        expect(error.message).toBe('Authentication required');
        expect(error.details).toBeUndefined();
    });

    it('unauthenticated accepts a custom message', () => {
        const error = ApiError.unauthenticated('Invalid credentials');

        expect(error.message).toBe('Invalid credentials');
    });

    it('forbidden uses default message and status', () => {
        const error = ApiError.forbidden();

        expect(error.code).toBe('auth.forbidden');
        expect(error.status).toBe(403);
        expect(error.message).toBe('Forbidden');
    });

    it('badRequest uses default message and status', () => {
        const error = ApiError.badRequest();

        expect(error.code).toBe('request.invalid');
        expect(error.status).toBe(400);
        expect(error.message).toBe('Request validation failed');
        expect(error.details).toBeUndefined();
    });

    it('badRequest accepts custom message and details', () => {
        const details = { issues: [{ path: 'name', message: 'Required' }] };
        const error = ApiError.badRequest('Validation failed', details);

        expect(error.message).toBe('Validation failed');
        expect(error.details).toEqual(details);
    });

    it('profileNotFound uses default message and status', () => {
        const error = ApiError.profileNotFound();

        expect(error.code).toBe('profile.not_found');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Profile not found');
    });

    it('organizationNotFound uses default message and status', () => {
        const error = ApiError.organizationNotFound();

        expect(error.code).toBe('org.not_found');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Organisation not found');
    });

    it('projectNotFound uses default message and status', () => {
        const error = ApiError.projectNotFound();

        expect(error.code).toBe('project.not_found');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Project not found');
    });

    it('jobNotFound uses default message and status', () => {
        const error = ApiError.jobNotFound();

        expect(error.code).toBe('job.not_found');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Job not found');
    });

    it('constructor still supports arbitrary error codes', () => {
        const error = new ApiError('internal.error', 500, 'An unexpected error occurred');

        expect(error.code).toBe('internal.error');
        expect(error.status).toBe(500);
        expect(error.message).toBe('An unexpected error occurred');
    });
});
