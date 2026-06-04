import type {
    IProfilesRepository,
    IProfilesService,
    IProfilesServiceDependencies,
    TMeContext,
    TMeMemberships,
    TResolvedMeContext,
} from '@aida/contracts';
import type { Database as ProfilesDatabase } from '@aida/db';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfilesSupabaseClient = SupabaseClient<ProfilesDatabase>;

export type ProfilesRepository = IProfilesRepository<ProfilesSupabaseClient>;

export type ProfilesService = IProfilesService;

export type ProfileServiceDependencies = IProfilesServiceDependencies;

export type MeMemberships = TMeMemberships;

export type MeContext = TMeContext;

export type ResolvedMeContext = TResolvedMeContext;
