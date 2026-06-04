'use client';

import { Button } from '@aida/ui';
import { useState } from 'react';

import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth/session';
import { AuthService } from '@/services/auth.service';

const PAGE_TITLE = 'Account overview';

export function Header() {
    const { status } = useAuth();
    const { data: user } = useProfile();
    const [signOutPending, setSignOutPending] = useState(false);

    const displayLabel = user?.displayName ?? user?.email ?? 'Signed in';
    const sessionLoading = status === 'loading';

    const handleSignOut = async () => {
        if (signOutPending) {
            return;
        }

        setSignOutPending(true);

        try {
            await AuthService.signOut();
        } catch {
            setSignOutPending(false);
        }
    };

    return (
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
            <div className="flex flex-col">
                <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Vault
                </p>
                <p className="m-0 text-lg font-semibold text-foreground">{PAGE_TITLE}</p>
            </div>
            <div className="m-0 flex flex-wrap items-center gap-2 text-sm">
                {sessionLoading ? (
                    <span>Loading session...</span>
                ) : (
                    <>
                        <span>{displayLabel}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                            disabled={signOutPending}
                            loadingDots={signOutPending}
                            textLoading="Signing out"
                        >
                            Sign out
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}
