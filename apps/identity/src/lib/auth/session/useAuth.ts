'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
    initialAuthSessionValue,
    readAuthSession,
} from '../utils/authSessionQuery';
import { authSessionQueryKey } from '@/constants/queryKeys';
import type { AuthSessionValue } from '../types/authSession.types';

/** Read auth state from the shared query cache so every auth-aware component stays in sync. */
export function useAuth(): AuthSessionValue {
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: authSessionQueryKey,
        queryFn: () => readAuthSession(queryClient),
        initialData: initialAuthSessionValue,
    });

    return data ?? initialAuthSessionValue;
}
