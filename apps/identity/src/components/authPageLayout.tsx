import type { ReactNode } from 'react';

type AuthPageLayoutProps = {
    title?: string;
    description?: string;
    children: ReactNode;
};

export function AuthPageLayout({ title, description, children }: AuthPageLayoutProps) {
    const hasHeader = Boolean(title || description);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-aida-bg px-6 py-14 font-sans text-foreground">
            <div className="flex w-full max-w-md flex-col items-center gap-8">
                <div
                    className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-primary"
                    aria-hidden="true"
                >
                    A
                </div>

                <div className="w-full rounded-2xl border border-border/60 bg-card px-8 py-9 shadow-lg">
                    <section className="w-full">
                        {hasHeader && (
                            <header className="mb-7 text-center">
                                {title && (
                                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
                                        {title}
                                    </h1>
                                )}

                                {description && (
                                    <p className="text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </header>
                        )}

                        {children}
                    </section>
                </div>
            </div>
        </main>
    );
}