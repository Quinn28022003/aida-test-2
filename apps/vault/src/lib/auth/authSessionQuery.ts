import type { QueryClient } from '@tanstack/react-query';

import { authSessionQueryKey } from '@/constants/queryKeys';

export type AuthSessionValue =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'authenticated'; authUserId: string };

export const initialAuthSessionValue: AuthSessionValue = {
    status: 'loading',
};

export function readAuthSession(queryClient: QueryClient): AuthSessionValue {
    return queryClient.getQueryData<AuthSessionValue>(authSessionQueryKey) ?? initialAuthSessionValue;
}

export function configureAuthSessionQueryClient(queryClient: QueryClient): void {
    queryClient.setQueryData(authSessionQueryKey, initialAuthSessionValue);
    queryClient.setQueryDefaults(authSessionQueryKey, {
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
}
