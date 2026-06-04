import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement, type ReactNode } from 'react';

import { configureAuthSessionQueryClient } from '@/lib/auth/authSessionQuery';

export function createTestQueryClient() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    configureAuthSessionQueryClient(queryClient);

    return queryClient;
}

export function createQueryWrapper(queryClient = createTestQueryClient()) {
    return function QueryWrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

export function renderWithQueryClient(ui: ReactElement, queryClient = createTestQueryClient()) {
    const Wrapper = createQueryWrapper(queryClient);
    return { queryClient, Wrapper };
}
