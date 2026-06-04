import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    AuthMode,
    JWTClaims,
    SupabaseContext,
    UserClaims,
} from '@supabase/server';
import type { Database } from '@aida/db';

/** Supabase client typed with the AIDA `Database` schema. */
export type TypedSupabaseClient = SupabaseClient<Database>;

/** Request-scoped Supabase context with AIDA database types. */
export type AidaSupabaseContext = Omit<SupabaseContext<Database>, 'supabase' | 'supabaseAdmin'> & {
    supabase: TypedSupabaseClient;
    supabaseAdmin: TypedSupabaseClient;
};

export type { AuthMode, JWTClaims, UserClaims };
