'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { authSessionQueryKey } from '@/constants/queryKeys';
import {
    initialAuthSessionValue,
    readAuthSession,
    type AuthSessionValue,
} from '@/lib/auth/authSessionQuery';

export function useAuth(): AuthSessionValue {
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: authSessionQueryKey,
        queryFn: () => readAuthSession(queryClient),
        initialData: initialAuthSessionValue,
    });

    return data ?? initialAuthSessionValue;
}
