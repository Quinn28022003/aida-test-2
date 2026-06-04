import { AgentUseCaseService, SupabaseAgentsRepository } from '@aida/agents';
import { describe, expect, it } from 'vitest';

import { createAgentUseCases } from './agents';
import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

describe('createAgentUseCases', () => {
    it('uses only the user-scoped Supabase client for agent use cases', () => {
        const supabase = {
            supabaseUrl: 'https://example.supabase.co',
            supabaseKey: 'publishable-key',
        } as TypedSupabaseClient;

        const useCases = createAgentUseCases(supabase) as never as {
            repository: unknown;
            supabase: TypedSupabaseClient;
        };

        expect(useCases.supabase).toBe(supabase);
        expect(useCases.repository).toBeInstanceOf(SupabaseAgentsRepository);
        expect(useCases).toBeInstanceOf(AgentUseCaseService);
        expect(useCases).not.toHaveProperty('supabaseAdmin');
    });
});
