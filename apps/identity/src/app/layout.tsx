import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Providers } from '@/components/providers';

import './globals.css';

export const metadata = {
    title: 'Aida Identity',
    description: 'Sign in to Aida',
};

type RootLayoutProps = {
    children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en-AU">
            <body>
                <Suspense fallback={null}>
                    <Providers>{children}</Providers>
                </Suspense>
            </body>
        </html>
    );
}
