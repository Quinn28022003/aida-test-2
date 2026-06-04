export const IDENTITY_AUTH_PATHS = {
    login: '/login',
    register: '/register',
    resetPasswordRequest: '/reset-password',
    resetPasswordUpdate: '/reset-password/update',
    acceptInvite: '/accept-invite',
} as const;

export function isIdentityAuthPath(pathname: string): boolean {
    return (Object.values(IDENTITY_AUTH_PATHS) as string[]).some(
        (authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`),
    );
}
