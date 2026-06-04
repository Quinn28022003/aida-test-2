'use client';

import { AuthSessionProvider } from '@/lib/auth/session';
import { useMemo, type ReactNode } from 'react';

import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

import { MainLayout } from './mainLayout';
import { QueryClientProvider } from './queryClientProvider';

type ProvidersProps = {
    children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
    const supabase = useMemo(() => getSupabaseClient(), []);

    return (
        <QueryClientProvider>
            <AuthSessionProvider supabase={supabase}>
                <MainLayout>{children}</MainLayout>
            </AuthSessionProvider>
        </QueryClientProvider>
    );
}
