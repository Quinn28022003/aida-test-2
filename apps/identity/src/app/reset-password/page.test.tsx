import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordRequestPage from './page';

const resetPasswordForEmail = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3000%2F'),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
    getSupabaseClient: () => ({
        auth: { resetPasswordForEmail },
    }),
}));

describe('ResetPasswordRequestPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks submit when the email is invalid', async () => {
        render(<ResetPasswordRequestPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
        await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
        expect(resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('shows a form-level message when reset email fails', async () => {
        resetPasswordForEmail.mockResolvedValue({
            error: { message: 'Unable to send reset email' },
        });

        render(<ResetPasswordRequestPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByText('Unable to send reset email')).toBeInTheDocument();
    });

    it('uses the identity reset update URL in redirectTo', async () => {
        resetPasswordForEmail.mockResolvedValue({ error: null });

        render(<ResetPasswordRequestPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await waitFor(() => {
            expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
                redirectTo:
                    'http://localhost:3000/reset-password/update?returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
            });
        });
    });

    it('preserves returnTo in the back to sign in link', () => {
        render(<ResetPasswordRequestPage />);

        expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
            'href',
            '/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
        );
    });
});
