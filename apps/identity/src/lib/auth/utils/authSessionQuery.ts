import type { QueryClient } from '@tanstack/react-query';

import { authSessionQueryKey } from '@/constants/queryKeys';
import type { AuthSessionValue } from '../types/authSession.types';

export const initialAuthSessionValue: AuthSessionValue = {
    status: 'loading',
};

/** Read the cached auth session, falling back to the initial loading state on first render. */
export function readAuthSession(queryClient: QueryClient): AuthSessionValue {
    return queryClient.getQueryData<AuthSessionValue>(authSessionQueryKey) ?? initialAuthSessionValue;
}

/** Pin auth session query data in the cache so auth state behaves like shared client state. */
export function configureAuthSessionQueryClient(queryClient: QueryClient): void {
    queryClient.setQueryData(authSessionQueryKey, initialAuthSessionValue);
    queryClient.setQueryDefaults(authSessionQueryKey, {
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
        refetchOnMount: false,
        refetchOnReconnect: false,
    });
}
