import { SupabaseProfilesRepository } from '@aida/profiles';
import { describe, expect, it, vi } from 'vitest';

import { createProfileUseCases } from './profiles';
import * as agentsCompositionModule from './agents';
import * as organizationsCompositionModule from './organizations';
import * as projectsCompositionModule from './projects';
import type { TypedSupabaseClient } from '../supabase/supabase-context.types';

describe('createProfileUseCases', () => {
    it('wires organization, project, and agent context services into ProfileUseCaseService', () => {
        const supabase = {
            supabaseUrl: 'https://example.supabase.co',
            supabaseKey: 'publishable-key',
        } as TypedSupabaseClient;
        const agentService = { scope: 'agent' };
        const organizationService = { scope: 'organization' };
        const projectService = { scope: 'project' };

        vi.spyOn(agentsCompositionModule, 'createAgentUseCases').mockReturnValue(
            agentService as never,
        );
        vi.spyOn(organizationsCompositionModule, 'createOrganizationUseCases').mockReturnValue(
            organizationService as never,
        );
        vi.spyOn(projectsCompositionModule, 'createProjectUseCases').mockReturnValue(
            projectService as never,
        );

        const useCases = createProfileUseCases(supabase) as never as {
            dependencies: {
                agentService: unknown;
                organizationService: unknown;
                projectService: unknown;
            };
            repository: unknown;
            supabase: TypedSupabaseClient;
        };

        expect(agentsCompositionModule.createAgentUseCases).toHaveBeenCalledWith(supabase);
        expect(organizationsCompositionModule.createOrganizationUseCases).toHaveBeenCalledWith(supabase);
        expect(projectsCompositionModule.createProjectUseCases).toHaveBeenCalledWith(supabase);
        expect(useCases.supabase).toBe(supabase);
        expect(useCases.repository).toBeInstanceOf(SupabaseProfilesRepository);
        expect(useCases.dependencies.agentService).toBe(agentService);
        expect(useCases.dependencies.organizationService).toBe(organizationService);
        expect(useCases.dependencies.projectService).toBe(projectService);
    });
});
