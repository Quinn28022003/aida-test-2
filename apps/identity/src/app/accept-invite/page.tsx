'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { Button } from '@aida/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { AuthPageLayout } from '@/components/authPageLayout';
import { preserveReturnToQuery } from '@/lib/auth/utils/redirect';

function buildAuthHref(basePath: string, nextPath: string, token: string | null): string {
    const params = new URLSearchParams({ next: nextPath });

    if (token) {
        params.set('token', token);
    }

    return `${basePath}?${params.toString()}`;
}

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const returnTo = searchParams.get('returnTo');
    const returnToQuery = preserveReturnToQuery(returnTo);
    const nextPath = token
        ? `${IDENTITY_AUTH_PATHS.acceptInvite}?token=${encodeURIComponent(token)}`
        : IDENTITY_AUTH_PATHS.acceptInvite;

    return (
        <AuthPageLayout>
            {!token ? (
                <div className="grid gap-4 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Invitation link invalid
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This invitation link is missing a token. Ask your administrator to send a
                        new invite.
                    </p>
                    <p className="text-center text-sm">
                        <Link
                            className="font-medium text-primary hover:underline"
                            href={`${IDENTITY_AUTH_PATHS.login}${returnToQuery}`}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Accept invitation
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in or create an account to accept this invitation. Full invite
                        acceptance will be completed after you authenticate.
                    </p>
                    <p className="text-sm text-muted-foreground">Invite token detected.</p>
                    <div className="grid gap-3">
                        <Button
                            className="w-full"
                            href={buildAuthHref(
                                `${IDENTITY_AUTH_PATHS.login}${returnToQuery}`,
                                nextPath,
                                token,
                            )}
                            size="lg"
                        >
                            Sign in to continue
                        </Button>
                        <Button
                            className="w-full"
                            href={buildAuthHref(
                                `${IDENTITY_AUTH_PATHS.register}${returnToQuery}`,
                                nextPath,
                                token,
                            )}
                            size="lg"
                            variant="outline"
                        >
                            Create an account
                        </Button>
                    </div>
                </div>
            )}
        </AuthPageLayout>
    );
}
