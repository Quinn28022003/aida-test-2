import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MainLayout } from './mainLayout';

const navigationMocks = vi.hoisted(() => ({
    pathname: '/',
}));

vi.mock('@aida/config/public', () => ({
    isIdentityAuthPath: (pathname: string) =>
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/accept-invite' ||
        pathname.startsWith('/reset-password'),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => navigationMocks.pathname,
}));

vi.mock('./sidebar', () => ({
    Sidebar: () => <div>Sidebar</div>,
}));

vi.mock('./header', () => ({
    Header: () => <div>Header</div>,
}));

describe('MainLayout', () => {
    beforeEach(() => {
        navigationMocks.pathname = '/';
    });

    it('renders the app shell outside identity routes', () => {
        render(
            <MainLayout>
                <div>Vault</div>
            </MainLayout>,
        );

        expect(screen.getByText('Sidebar')).toBeInTheDocument();
        expect(screen.getByText('Header')).toBeInTheDocument();
        expect(screen.getByText('Vault')).toBeInTheDocument();
    });

    it('returns auth route children without rendering the app shell', () => {
        navigationMocks.pathname = '/login';

        render(
            <MainLayout>
                <div>Identity page</div>
            </MainLayout>,
        );

        expect(screen.getByText('Identity page')).toBeInTheDocument();
        expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
        expect(screen.queryByText('Header')).not.toBeInTheDocument();
    });
});
