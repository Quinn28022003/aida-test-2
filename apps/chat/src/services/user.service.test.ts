import { getMe, getProfilesById, type ApiClient } from '@aida/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from './user.service';

vi.mock('@aida/api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/api-client')>();

    return {
        ...actual,
        getMe: vi.fn(),
        getProfilesById: vi.fn(),
    };
});

const requestId = '00000000-0000-4000-8000-000000000099';
const authUserId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000002';
const orgId = '00000000-0000-4000-8000-000000000003';
const projectId = '00000000-0000-4000-8000-000000000004';
const jobId = '00000000-0000-4000-8000-000000000005';
const api = {} as ApiClient;

function profileRow() {
    return {
        authUserId,
        id: profileId,
        email: 'user@example.com',
        displayName: 'Quinn',
        avatarUrl: null,
        timezone: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function failureEnvelope(message: string) {
    return {
        success: false,
        error: {
            code: 'request.invalid',
            message,
        },
        requestId,
    };
}

function meContextData() {
    return {
        organizations: [
            {
                id: orgId,
                name: 'Acme',
                slug: 'acme',
                plan: 'pro',
                dataRegion: 'au',
                defaultLocale: 'en-AU',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        projects: [
            {
                id: projectId,
                orgId,
                name: 'Kitchen',
                key: 'KITCHEN',
                description: null,
                status: 'active',
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        jobs: [
            {
                id: jobId,
                orgId,
                projectId,
                title: 'Client job',
                status: 'open',
                customerProfileId: profileId,
                externalRef: null,
                metadata: {},
                createdBy: profileId,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        agents: [],
        conversations: [],
        memberships: {
            agents: [],
            conversations: [],
            organizations: [],
            projects: [],
            jobs: [],
        },
    };
}

describe('UserService', () => {
    beforeEach(() => {
        vi.mocked(getProfilesById).mockReset();
        vi.mocked(getMe).mockReset();
    });

    it('returns parsed profile data from GET /profiles/:id', async () => {
        vi.mocked(getProfilesById).mockResolvedValue({
            data: { success: true, data: profileRow(), requestId },
            error: undefined,
            response: new Response(null, { status: 200 }),
        } as Awaited<ReturnType<typeof getProfilesById>>);

        const result = await UserService.getProfileByAuthUserId(authUserId, api);

        expect(getProfilesById).toHaveBeenCalledWith({
            client: api,
            path: { id: authUserId },
        });
        expect(result.email).toBe('user@example.com');
        expect(result.displayName).toBe('Quinn');
    });

    it('throws failure envelope messages when profile loading fails', async () => {
        vi.mocked(getProfilesById).mockResolvedValue({
            data: undefined,
            error: failureEnvelope('Profile unavailable'),
            response: new Response(null, { status: 404 }),
        } as Awaited<ReturnType<typeof getProfilesById>>);

        await expect(UserService.getProfileByAuthUserId(authUserId, api)).rejects.toThrow('Profile unavailable');
    });

    it('throws fallback message when profile failure body is malformed', async () => {
        vi.mocked(getProfilesById).mockResolvedValue({
            data: undefined,
            error: { message: 'not an envelope' },
            response: new Response(null, { status: 500 }),
        } as Awaited<ReturnType<typeof getProfilesById>>);

        await expect(UserService.getProfileByAuthUserId(authUserId, api)).rejects.toThrow('Failed to load user profile');
    });

    it('returns parsed me context data', async () => {
        vi.mocked(getMe).mockResolvedValue({
            data: { success: true, data: meContextData(), requestId },
            error: undefined,
            response: new Response(null, { status: 200 }),
        } as Awaited<ReturnType<typeof getMe>>);

        await expect(UserService.getMeContext(api)).resolves.toEqual(
            expect.objectContaining({
                organizations: [expect.objectContaining({ id: orgId })],
                projects: [expect.objectContaining({ id: projectId })],
                jobs: [expect.objectContaining({ id: jobId })],
            }),
        );
    });

    it('throws API envelope messages when me context loading fails', async () => {
        vi.mocked(getMe).mockResolvedValue({
            data: undefined,
            error: {
                ...failureEnvelope('Could not load your dashboard data.'),
                error: {
                    ...failureEnvelope('Could not load your dashboard data.').error,
                    details: { reason: 'timeout' },
                },
            },
            response: new Response(null, { status: 500 }),
        } as Awaited<ReturnType<typeof getMe>>);

        await expect(UserService.getMeContext(api)).rejects.toThrow(
            'Could not load your dashboard data.: timeout',
        );
    });
});
