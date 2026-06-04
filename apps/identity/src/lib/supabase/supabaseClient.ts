import { getIdentityPublicEnv } from '@aida/config/public';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CreateSupabaseClientOptions = {
    supabaseUrl: string;
    supabaseAnonKey: string;
};

/**
 * Browser-safe Supabase client for Identity.
 * Uses the public anon key only — never pass service-role or secret keys here.
 * Session persistence is handled by `@supabase/ssr` cookie storage, not localStorage.
 */
export function createSupabaseClient(options?: CreateSupabaseClientOptions): SupabaseClient {
    const supabaseUrl = options?.supabaseUrl ?? getIdentityPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
        options?.supabaseAnonKey ?? getIdentityPublicEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

let supabaseClient: SupabaseClient | undefined;

/** Shared Supabase client for auth UI and session listeners. */
export function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        supabaseClient = createSupabaseClient();
    }

    return supabaseClient;
}
