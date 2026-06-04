import { getVaultPublicEnv } from '@aida/config/public';
import { IDENTITY_AUTH_PATHS } from '@aida/config/public';

import { isSafeLocalPath } from './session/redirect';

function getIdentityDomain(): string {
    return getVaultPublicEnv().NEXT_PUBLIC_IDENTITY_DOMAIN.replace(/\/$/, '');
}

export function redirectToExternalUrl(url: string): void {
    window.location.assign(url);
}

export function resolveProductReturnTo(searchParams: URLSearchParams): string {
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
        return returnTo;
    }

    const next = searchParams.get('next');
    if (isSafeLocalPath(next)) {
        return `${window.location.origin}${next}`;
    }

    return `${window.location.origin}/`;
}

export function buildIdentityLoginRedirect(returnTo: string): string {
    const params = new URLSearchParams({ returnTo });
    return `${getIdentityDomain()}${IDENTITY_AUTH_PATHS.login}?${params.toString()}`;
}

export function buildIdentityLoginRedirectFromLocation(
    origin: string,
    pathname: string,
    searchParams: URLSearchParams,
): string {
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return buildIdentityLoginRedirect(`${origin}${pathname}${search}`);
}

export function buildIdentityAuthRedirectUrl(
    authPath: string,
    searchParams: URLSearchParams,
): string {
    const params = new URLSearchParams();
    params.set('returnTo', resolveProductReturnTo(searchParams));

    const token = searchParams.get('token');
    if (token) {
        params.set('token', token);
    }

    return `${getIdentityDomain()}${authPath}?${params.toString()}`;
}
