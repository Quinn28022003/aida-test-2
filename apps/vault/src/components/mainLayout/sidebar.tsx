'use client';

import Link from 'next/link';

import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth/session';

export function Sidebar() {
    const { status } = useAuth();
    const { data: user } = useProfile();

    const displayLabel = user?.displayName ?? user?.email ?? 'Signed in';
    const emailLabel = user?.email ?? '';
    const sessionLoading = status === 'loading';

    return (
        <aside className="flex w-full flex-col gap-6 border-b border-border bg-card px-4 py-6 md:w-64 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    AV
                </div>
                <div>
                    <p className="m-0 text-sm font-semibold uppercase tracking-widest text-primary">
                        Aida Vault
                    </p>
                    <p className="m-0 text-xs text-muted-foreground">Secure workspace</p>
                </div>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
                <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Navigation
                </p>
                <Link
                    className="rounded-md px-3 py-2 text-foreground transition hover:bg-muted"
                    href="/"
                >
                    Account overview
                </Link>
            </nav>
            <div className="mt-auto rounded-md border border-border bg-background p-3 text-xs">
                <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Signed in
                </p>
                <p className="m-0 text-sm font-semibold text-foreground">
                    {sessionLoading ? 'Loading session...' : displayLabel}
                </p>
                {emailLabel ? <p className="m-0 text-xs text-muted-foreground">{emailLabel}</p> : null}
            </div>
        </aside>
    );
}
