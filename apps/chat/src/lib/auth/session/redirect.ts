import { IDENTITY_AUTH_PATHS, isIdentityAuthPath } from '@aida/config/public';

export function isSafeLocalPath(path: string | null | undefined): path is string {
    if (!path) {
        return false;
    }

    if (!path.startsWith('/') || path.startsWith('//')) {
        return false;
    }

    if (path.includes('://')) {
        return false;
    }

    return true;
}

export function buildLoginRedirect(pathname: string): string {
    const params = new URLSearchParams({ next: pathname });
    return `${IDENTITY_AUTH_PATHS.login}?${params.toString()}`;
}

export function resolvePostAuthRedirect(nextParam: string | null): string {
    if (isSafeLocalPath(nextParam) && !isIdentityAuthPath(nextParam)) {
        return nextParam;
    }

    return '/';
}

export function shouldRedirectAuthenticatedFromAuthPage(pathname: string): boolean {
    return (
        pathname === IDENTITY_AUTH_PATHS.login || pathname === IDENTITY_AUTH_PATHS.register
    );
}

export function shouldGuardPath(pathname: string): boolean {
    return !isIdentityAuthPath(pathname);
}
