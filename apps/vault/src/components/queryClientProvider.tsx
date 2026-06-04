'use client';

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';

import { configureAuthSessionQueryClient } from '@/lib/auth/authSessionQuery';

// Dynamically import React Query Devtools only in development mode (lazy, no SSR)
const ReactQueryDevtools =
    process.env.NODE_ENV === 'development'
        ? dynamic(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })), {
              ssr: false,
          })
        : () => null;

export function QueryClientProvider({ children }: { children: ReactNode }) {
    // Initialize QueryClient only once per component lifetime
    const [queryClient] = useState(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    // When the user refocuses the browser/tab, queries will NOT refetch by default
                    refetchOnWindowFocus: false,
                    // Data is considered fresh for 1 minute
                    staleTime: 60 * 1000,
                    // Unused data remains in cache for 5 minutes before garbage collection
                    gcTime: 5 * 60 * 1000,
                    // If a query fails, retry up to 2 times
                    retry: 2,
                },
                mutations: {
                    // Mutations will not retry by default to avoid duplicate requests
                    retry: 0,
                },
            },
        });

        configureAuthSessionQueryClient(client);

        return client;
    });

    return (
        <TanstackQueryClientProvider client={queryClient}>
            {children}
            {/* Only render Devtools in development mode */}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </TanstackQueryClientProvider>
    );
}
