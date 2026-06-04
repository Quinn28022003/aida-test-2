import { AgentUseCaseService, SupabaseAgentsRepository } from '@aida/agents';

import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

export function createAgentUseCases(
    supabase: TypedSupabaseClient,
) {
    const agentsRepository = new SupabaseAgentsRepository();

    return new AgentUseCaseService(supabase, agentsRepository);
}
