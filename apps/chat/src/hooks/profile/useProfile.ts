'use client';

import { useQuery } from '@tanstack/react-query';

import { profileQueryKey } from '@/constants/queryKeys';
import { useAuth } from '@/lib/auth/session';
import { UserService } from '@/services/user.service';

export function useProfile() {
    const auth = useAuth();

    return useQuery({
        queryKey: profileQueryKey,
        queryFn: () => {
            if (auth.status !== 'authenticated') {
                throw new Error('No authenticated user session');
            }

            return UserService.getProfileByAuthUserId(auth.authUserId);
        },
        enabled: auth.status === 'authenticated',
    });
}
