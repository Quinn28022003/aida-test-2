import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';

const signInWithPassword = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3000%2F'),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
    getSupabaseClient: () => ({
        auth: { signInWithPassword },
    }),
}));

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks submit when the email is invalid', async () => {
        render(<LoginPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
        expect(signInWithPassword).not.toHaveBeenCalled();
    });

    it('shows a generic message when sign-in credentials are invalid', async () => {
        signInWithPassword.mockResolvedValue({
            error: { message: 'Invalid login credentials' },
        });

        render(<LoginPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'wrong');
        await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    });

    it('calls signInWithPassword on submit', async () => {
        signInWithPassword.mockResolvedValue({ error: null });

        render(<LoginPage />);

        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(signInWithPassword).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'Password1!',
            });
        });
    });

    it('preserves returnTo in the forgot password and sign up links', () => {
        render(<LoginPage />);

        expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
            'href',
            '/reset-password?returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
        );
        expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
            'href',
            '/register?returnTo=http%3A%2F%2Flocalhost%3A3000%2F',
        );
    });
});
