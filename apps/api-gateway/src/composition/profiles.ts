import { ProfileUseCaseService, SupabaseProfilesRepository } from '@aida/profiles';

import { createAgentUseCases } from './agents';
import { createOrganizationUseCases } from './organizations';
import { createProjectUseCases } from './projects';
import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

export function createProfileUseCases(supabase: TypedSupabaseClient) {
    const agentService = createAgentUseCases(supabase);
    const profileRepository = new SupabaseProfilesRepository();
    const organizationService = createOrganizationUseCases(supabase);
    const projectService = createProjectUseCases(supabase);

    return new ProfileUseCaseService(supabase, profileRepository, {
        agentService,
        organizationService,
        projectService,
    });
}
