'use client';

import { useMemo, type ReactNode } from 'react';

import { AuthSessionProvider } from '@/lib/auth/session';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

import { QueryClientProvider } from './queryClientProvider';

type ProvidersProps = {
    children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
    const supabase = useMemo(() => getSupabaseClient(), []);

    return (
        <QueryClientProvider>
            <AuthSessionProvider supabase={supabase}>{children}</AuthSessionProvider>
        </QueryClientProvider>
    );
}
