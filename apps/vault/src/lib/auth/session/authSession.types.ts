import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthSessionProviderProps = {
    children: ReactNode;
    supabase: SupabaseClient;
};
