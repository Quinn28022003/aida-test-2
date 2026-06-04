import { parseDatabaseRow, profilesRowSchema, type ProfilesRow } from '@aida/db';

import type { ProfilesRepository } from './profiles.types';

type RepositoryParams<TMethod extends keyof ProfilesRepository> = ProfilesRepository[TMethod] extends (
  params: infer TParams,
) => unknown
  ? TParams
  : never;

export class SupabaseProfilesRepository implements ProfilesRepository {
  /** Fetches a profile by its auth provider user id. */
  async getByAuthUserId({
    client: supabase,
    authUserId,
  }: RepositoryParams<'getByAuthUserId'>): Promise<ProfilesRow | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return profile ? parseDatabaseRow(profile, profilesRowSchema) : null;
  }
}
