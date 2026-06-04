'use client';

import type { OrganizationsRow } from '@aida/db';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meContextQueryKey } from '@/constants/queryKeys';
import { useProfile } from '@/hooks/profile';
import { OrganizationService } from '@/services/organization.service';

type ProfileIdentity = {
    id?: string;
    displayName?: string | null;
    email?: string | null;
};

type UseCreateOrganizationOptions = {
    onSuccess?: (organization: OrganizationsRow) => void;
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

function buildDefaultOrganizationDraft(profile: ProfileIdentity): { name: string; slug: string } {
    const emailLocalPart = profile.email?.split('@')[0]?.trim();
    const sourceName = profile.displayName?.trim() || emailLocalPart || 'My Organisation';
    const normalisedName = sourceName.length > 0 ? sourceName : 'My Organisation';
    const orgName = normalisedName.endsWith('Organisation') ? normalisedName : `${normalisedName} Organisation`;
    const slugBase = slugify(orgName) || 'my-organisation';
    const suffix = Math.random().toString(36).slice(2, 6);

    return {
        name: orgName,
        slug: `${slugBase}-${suffix}`,
    };
}

export function useCreateOrganization(options?: UseCreateOrganizationOptions) {
    const queryClient = useQueryClient();
    const { data: profile } = useProfile();

    return useMutation({
        mutationFn: () => {
            const defaults = buildDefaultOrganizationDraft({
                id: profile?.id,
                displayName: profile?.displayName,
                email: profile?.email,
            });
            return OrganizationService.create(defaults);
        },
        onSuccess: async (organization) => {
            await queryClient.invalidateQueries({ queryKey: meContextQueryKey });
            options?.onSuccess?.(organization);
        },
    });
}
