import { getOrgsByOrgIdProjects, postOrgs, type ApiClient } from '@aida/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationService } from './organization.service';

vi.mock('@aida/api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aida/api-client')>();

    return {
        ...actual,
        getOrgsByOrgIdProjects: vi.fn(),
        postOrgs: vi.fn(),
    };
});

const requestId = '00000000-0000-4000-8000-000000000099';
const orgId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000002';
const projectId = '00000000-0000-4000-8000-000000000003';
const api = {} as ApiClient;

function organizationRow() {
    return {
        id: orgId,
        name: 'Acme',
        slug: 'acme',
        plan: 'pro',
        dataRegion: 'default',
        defaultLocale: 'en-US',
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function projectRow() {
    return {
        id: projectId,
        orgId,
        name: 'Kitchen',
        key: 'KITCHEN',
        description: null,
        status: 'active',
        createdBy: profileId,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
}

function failureResponse(message: string, reason?: string) {
    return {
        data: undefined,
        error: {
            success: false,
            error: {
                code: 'request.invalid',
                message,
                details: reason ? { reason } : undefined,
            },
            requestId,
        },
        response: new Response(null, { status: 400 }),
    };
}

describe('OrganizationService', () => {
    beforeEach(() => {
        vi.mocked(postOrgs).mockReset();
        vi.mocked(getOrgsByOrgIdProjects).mockReset();
    });

    it('creates an organisation with default region and locale', async () => {
        vi.mocked(postOrgs).mockResolvedValue({
            data: { success: true, data: organizationRow(), requestId },
            error: undefined,
            response: new Response(null, { status: 201 }),
        } as Awaited<ReturnType<typeof postOrgs>>);

        await expect(OrganizationService.create({ name: 'Acme', slug: 'acme' }, api)).resolves.toEqual(
            expect.objectContaining({ id: orgId }),
        );
        expect(postOrgs).toHaveBeenCalledWith({
            client: api,
            body: {
                name: 'Acme',
                slug: 'acme',
                dataRegion: 'default',
                defaultLocale: 'en-US',
            },
        });
    });

    it('maps thrown create failures to the user-facing organisation error', async () => {
        vi.mocked(postOrgs).mockRejectedValue(new Error('network down'));

        await expect(OrganizationService.create({ name: 'Acme', slug: 'acme' }, api)).rejects.toThrow(
            'Could not create your organisation. Please try again.',
        );
    });

    it('throws API envelope messages when organisation creation fails', async () => {
        vi.mocked(postOrgs).mockResolvedValue(
            failureResponse('Could not create organisation', 'duplicate slug') as Awaited<ReturnType<typeof postOrgs>>,
        );

        await expect(OrganizationService.create({ name: 'Acme', slug: 'acme' }, api)).rejects.toThrow(
            'Could not create organisation: duplicate slug',
        );
    });

    it('lists organisation projects from the success envelope', async () => {
        vi.mocked(getOrgsByOrgIdProjects).mockResolvedValue({
            data: { success: true, data: [projectRow()], requestId },
            error: undefined,
            response: new Response(null, { status: 200 }),
        } as Awaited<ReturnType<typeof getOrgsByOrgIdProjects>>);

        await expect(OrganizationService.listProjects(orgId, api)).resolves.toEqual([
            expect.objectContaining({ id: projectId }),
        ]);
    });

    it('throws API envelope messages when project listing fails', async () => {
        vi.mocked(getOrgsByOrgIdProjects).mockResolvedValue(
            failureResponse('Could not load work items for this business.') as Awaited<
                ReturnType<typeof getOrgsByOrgIdProjects>
            >,
        );

        await expect(OrganizationService.listProjects(orgId, api)).rejects.toThrow(
            'Could not load work items for this business.',
        );
    });
});
