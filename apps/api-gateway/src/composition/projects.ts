import { ProjectUseCaseService, SupabaseProjectsRepository } from '@aida/projects';

import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

export function createProjectUseCases(
    supabase: TypedSupabaseClient,
) {
    const projectRepository = new SupabaseProjectsRepository();

    return new ProjectUseCaseService(supabase, projectRepository);
}
