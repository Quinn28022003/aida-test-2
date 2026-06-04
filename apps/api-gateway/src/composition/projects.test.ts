import { SupabaseProjectsRepository } from '@aida/projects';
import { describe, expect, it } from 'vitest';

import { createProjectUseCases } from './projects';
import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

describe('createProjectUseCases', () => {
    it('uses only the user-scoped Supabase client for normal project use cases', () => {
        const supabase = {
            supabaseUrl: 'https://example.supabase.co',
            supabaseKey: 'publishable-key',
        } as TypedSupabaseClient;

        const useCases = createProjectUseCases(supabase) as never as {
            repository: unknown;
            supabase: TypedSupabaseClient;
        };

        expect(useCases.supabase).toBe(supabase);
        expect(useCases.repository).toBeInstanceOf(SupabaseProjectsRepository);
        expect(useCases).not.toHaveProperty('supabaseAdmin');
    });
});
