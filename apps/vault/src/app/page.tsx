'use client';

import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/lib/auth/session';

export default function Page() {
    const { status } = useAuth();
    const { data: user, isLoading, isError } = useProfile();

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <header className="flex flex-col gap-2">
                <span className="inline-block rounded-full bg-secondary px-3 py-1.5 text-xs uppercase tracking-widest text-primary">
                    Vault
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Organisation vault
                </h1>
                <p className="font-semibold">Session: {status}</p>
                {isLoading ? <p className="mt-3.5 text-muted-foreground">Loading profile…</p> : null}
                {isError ? <p className="mt-3.5 text-muted-foreground">Could not load profile.</p> : null}
            </header>
            <section className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Account details
                </h2>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium text-muted-foreground">Email</dt>
                        <dd>{user?.email ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-muted-foreground">Display name</dt>
                        <dd>{user?.displayName ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-muted-foreground">Profile ID</dt>
                        <dd className="break-all font-mono text-xs">{user?.id ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-muted-foreground">Auth user ID</dt>
                        <dd className="break-all font-mono text-xs">{user?.authUserId ?? '—'}</dd>
                    </div>
                    {user?.timezone ? (
                        <div>
                            <dt className="font-medium text-muted-foreground">Timezone</dt>
                            <dd>{user.timezone}</dd>
                        </div>
                    ) : null}
                </dl>
            </section>
        </div>
    );
}
