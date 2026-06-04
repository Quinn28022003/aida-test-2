import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AcceptInvitePage from './page';

let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
    useSearchParams: () => searchParams,
}));

describe('AcceptInvitePage', () => {
    beforeEach(() => {
        searchParams = new URLSearchParams();
    });

    it('renders the invalid-token state when no token is present', () => {
        searchParams = new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3000%2F');

        render(<AcceptInvitePage />);

        expect(screen.getByRole('heading', { name: 'Invitation link invalid' })).toBeInTheDocument();
        expect(
            screen.getByText(
                'This invitation link is missing a token. Ask your administrator to send a new invite.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
            'href',
            '/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
        );
    });

    it('renders the valid-token state when a token is present', () => {
        searchParams = new URLSearchParams(
            'token=abc123&returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
        );

        render(<AcceptInvitePage />);

        expect(screen.getByRole('heading', { name: 'Accept invitation' })).toBeInTheDocument();
        expect(screen.getByText('Invite token detected.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute(
            'href',
            '/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2F?next=%2Faccept-invite%3Ftoken%3Dabc123&token=abc123',
        );
        expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
            'href',
            '/register?returnTo=http%3A%2F%2Flocalhost%3A3000%2F?next=%2Faccept-invite%3Ftoken%3Dabc123&token=abc123',
        );
    });
});
