'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect } from 'react';

import { authSessionQueryKey, profileQueryKey } from '@/constants/queryKeys';
import type { AuthSessionValue } from '@/lib/auth/authSessionQuery';

import type { AuthSessionProviderProps } from './authSession.types';
import { useAuth } from './useAuth';
import {
    buildIdentityAuthRedirectUrl,
    buildIdentityLoginRedirectFromLocation,
    redirectToExternalUrl,
} from '../identityRedirect';
import { shouldGuardPath } from './redirect';

function toAuthSessionValue(session: Session | null): AuthSessionValue {
    if (!session) {
        return { status: 'unauthenticated' };
    }

    return { status: 'authenticated', authUserId: session.user.id };
}

export function AuthSessionProvider({ children, supabase }: AuthSessionProviderProps) {
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

            if (event === 'SIGNED_OUT') {
                queryClient.removeQueries({ queryKey: profileQueryKey });
            }

            if (event === 'SIGNED_IN') {
                void queryClient.invalidateQueries({ queryKey: profileQueryKey });
            }

            if (event === 'PASSWORD_RECOVERY') {
                redirectToExternalUrl(
                    buildIdentityAuthRedirectUrl(
                        IDENTITY_AUTH_PATHS.resetPasswordUpdate,
                        new URLSearchParams(window.location.search),
                    ),
                );
            }
        });

        return () => {
            active = false;
            authListener.subscription.unsubscribe();
        };
    }, [queryClient, setAuthLoading, setAuthSession, supabase.auth]);

    useEffect(() => {
        if (status === 'loading') {
            return;
        }

        if (status === 'unauthenticated' && shouldGuardPath(pathname)) {
            redirectToExternalUrl(
                buildIdentityLoginRedirectFromLocation(
                    window.location.origin,
                    pathname,
                    searchParams,
                ),
            );
        }
    }, [pathname, searchParams, status]);

    return (
        <div
            className="flex min-h-screen flex-col bg-aida-bg font-sans text-foreground"
            data-theme="vault"
        >
            {children}
        </div>
    );
}
