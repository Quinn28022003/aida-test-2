'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { AuthRedirectLoading } from '@/components/authRedirectLoading';
import { buildIdentityAuthRedirectUrl, redirectToExternalUrl } from '@/lib/auth/identityRedirect';

export default function LoginPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        redirectToExternalUrl(buildIdentityAuthRedirectUrl(IDENTITY_AUTH_PATHS.login, searchParams));
    }, [searchParams]);

    return <AuthRedirectLoading />;
}
