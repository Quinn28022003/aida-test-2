import { OrganizationUseCaseService, SupabaseOrganizationsRepository } from '@aida/organizations';

import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

export function createOrganizationUseCases(
    supabase: TypedSupabaseClient,
) {
    const organizationRepository = new SupabaseOrganizationsRepository();

    return new OrganizationUseCaseService(
        supabase,
        organizationRepository,
    );
}
