import { SupabaseOrganizationsRepository } from '@aida/organizations';
import { describe, expect, it } from 'vitest';

import { createOrganizationUseCases } from './organizations';
import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

describe('createOrganizationUseCases', () => {
    it('uses only the user-scoped Supabase client for normal organization use cases', () => {
        const supabase = {
            supabaseUrl: 'https://example.supabase.co',
            supabaseKey: 'publishable-key',
        } as TypedSupabaseClient;

        const useCases = createOrganizationUseCases(supabase) as never as {
            repository: unknown;
            supabase: TypedSupabaseClient;
        };

        expect(useCases.supabase).toBe(supabase);
        expect(useCases.repository).toBeInstanceOf(SupabaseOrganizationsRepository);
        expect(useCases).not.toHaveProperty('supabaseAdmin');
    });
});
