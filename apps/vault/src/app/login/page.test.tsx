import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LoginPage from './page';

const identityRedirectMocks = vi.hoisted(() => ({
    buildIdentityAuthRedirectUrl: vi.fn(() => 'http://localhost:3006/login'),
    redirectToExternalUrl: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3006%2F'),
}));

vi.mock('@/lib/auth/identityRedirect', () => ({
    buildIdentityAuthRedirectUrl: identityRedirectMocks.buildIdentityAuthRedirectUrl,
    redirectToExternalUrl: identityRedirectMocks.redirectToExternalUrl,
}));

describe('LoginPage', () => {
    it('shows a redirecting spinner while handing off to identity', () => {
        render(<LoginPage />);

        expect(screen.getByText('Redirecting')).toBeInTheDocument();
        expect(identityRedirectMocks.buildIdentityAuthRedirectUrl).toHaveBeenCalled();
        expect(identityRedirectMocks.redirectToExternalUrl).toHaveBeenCalledWith(
            'http://localhost:3006/login',
        );
    });
});
