import type { AidaSupabaseContext } from './supabase/supabase-context.types';
import type { SUPABASE_CONTEXT_KEY } from './supabase/context';

export type AppVariables = {
    requestId: string;
    [SUPABASE_CONTEXT_KEY]?: AidaSupabaseContext;
};
