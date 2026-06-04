import { getIdentityPublicEnv, IDENTITY_AUTH_PATHS, parseCommaSeparatedOrigins } from '@aida/config/public';

/** Default authenticated landing page when no safe return destination is supplied. */
export function getDefaultReturnDestination(): string {
    const chatDomain = getIdentityPublicEnv().NEXT_PUBLIC_CHAT_DOMAIN.replace(/\/$/, '');
    return `${chatDomain}/`;
}

/** Allowed origins are configured centrally so auth pages only redirect to trusted domains. */
export function getAllowedReturnToOrigins(): string[] {
    return parseCommaSeparatedOrigins(
        getIdentityPublicEnv().NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS,
    );
}

/** Accept an explicit return URL only when it parses cleanly and its origin is allow-listed. */
export function resolveReturnTo(returnToParam: string | null): string {
    const defaultDestination = getDefaultReturnDestination();

    if (!returnToParam) {
        return defaultDestination;
    }

    try {
        const url = new URL(returnToParam);
        if (getAllowedReturnToOrigins().includes(url.origin)) {
            return url.href;
        }
    } catch {
        return defaultDestination;
    }

    return defaultDestination;
}

/** Preserve the current return destination when linking between auth screens. */
export function preserveReturnToQuery(returnTo: string | null): string {
    if (!returnTo) {
        return '';
    }

    return `?returnTo=${encodeURIComponent(returnTo)}`;
}

/** Only login and register pages should bounce authenticated users away automatically. */
export function shouldRedirectAuthenticatedFromAuthPage(pathname: string): boolean {
    return (
        pathname === IDENTITY_AUTH_PATHS.login || pathname === IDENTITY_AUTH_PATHS.register
    );
}
