'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect } from 'react';

import { authSessionQueryKey, profileQueryKey } from '@/constants/queryKeys';
import type { AuthSessionProviderProps, AuthSessionValue } from '../types/authSession.types';
import { useAuth } from './useAuth';
import { resolveReturnTo, shouldRedirectAuthenticatedFromAuthPage } from '../utils/redirect';

/** Reduce Supabase session objects down to the auth state the UI actually consumes. */
function toAuthSessionValue(session: Session | null): AuthSessionValue {
    if (!session) {
        return { status: 'unauthenticated' };
    }

    return { status: 'authenticated', authUserId: session.user.id };
}

export function AuthSessionProvider({ children, supabase }: AuthSessionProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { status } = useAuth();

    const setAuthLoading = useCallback(() => {
        queryClient.setQueryData(authSessionQueryKey, { status: 'loading' });
    }, [queryClient]);

    const setAuthSession = useCallback(
        (session: Session | null) => {
            queryClient.setQueryData(authSessionQueryKey, toAuthSessionValue(session));
        },
        [queryClient],
    );

    useEffect(() => {
        let active = true;

        // Hydrate the initial session once on mount before real-time auth events start flowing in.
        async function initialise() {
            const { data } = await supabase.auth.getSession();

            if (!active) {
                return;
            }

            setAuthSession(data.session);
        }

        setAuthLoading();
        void initialise();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
            setAuthSession(nextSession);

            // Profile data belongs to the current user, so clear or refetch it when auth changes.
            if (event === 'SIGNED_OUT') {
                queryClient.removeQueries({ queryKey: profileQueryKey });
            }

            if (event === 'SIGNED_IN') {
                void queryClient.invalidateQueries({ queryKey: profileQueryKey });
            }

            if (event === 'PASSWORD_RECOVERY') {
                // Supabase sends recovery events on the auth callback route, so move users to the
                // in-app password update screen while preserving any pending return destination.
                const returnTo = new URLSearchParams(window.location.search).get('returnTo');
                const returnToQuery = returnTo
                    ? `?returnTo=${encodeURIComponent(returnTo)}`
                    : '';
                router.replace(`${IDENTITY_AUTH_PATHS.resetPasswordUpdate}${returnToQuery}`);
            }
        });

        return () => {
            active = false;
            authListener.subscription.unsubscribe();
        };
    }, [queryClient, router, setAuthLoading, setAuthSession, supabase.auth]);

    useEffect(() => {
        if (status === 'loading') {
            return;
        }

        // Authenticated users should not stay on entry pages once session state is known.
        if (status === 'authenticated' && shouldRedirectAuthenticatedFromAuthPage(pathname)) {
            router.replace(resolveReturnTo(searchParams.get('returnTo')));
        }
    }, [pathname, router, searchParams, status]);

    return children;
}
