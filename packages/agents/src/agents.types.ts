import type {
    IAgentsService,
    IAgentsRepository,
} from '@aida/contracts';
import type { Database } from '@aida/db';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AgentsSupabaseClient = SupabaseClient<Database>;

export type AgentsRepository = IAgentsRepository<AgentsSupabaseClient>;

export type AgentUseCaseServiceType = IAgentsService;
