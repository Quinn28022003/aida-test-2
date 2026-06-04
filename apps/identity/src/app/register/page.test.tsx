import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from './page';

const signUp = vi.fn();

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3000%2Fdashboard'),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
    getSupabaseClient: () => ({
        auth: { signUp },
    }),
}));

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks submit when passwords are too short or do not match', async () => {
        render(<RegisterPage />);

        await userEvent.type(screen.getByLabelText('Display name'), 'Quinn');
        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'short');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'different');
        await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

        expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        expect(signUp).not.toHaveBeenCalled();
    });

    it('shows a form-level message when sign up fails', async () => {
        signUp.mockResolvedValue({ error: { message: 'Unable to create your account' } });

        render(<RegisterPage />);

        await userEvent.type(screen.getByLabelText('Display name'), 'Quinn');
        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

        expect(await screen.findByText('Unable to create your account')).toBeInTheDocument();
    });

    it('calls signUp on submit', async () => {
        signUp.mockResolvedValue({ error: null });

        render(<RegisterPage />);

        await userEvent.type(screen.getByLabelText('Display name'), 'Alex');
        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

        await waitFor(() => {
            expect(signUp).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'Password1!',
                options: {
                    data: {
                        display_name: 'Alex',
                    },
                },
            });
        });
    });

    it('preserves returnTo in sign-in links before and after confirmation', async () => {
        signUp.mockResolvedValue({ error: null });

        render(<RegisterPage />);

        expect(screen.getByRole('link', { name: 'Already have an account? Sign in' })).toHaveAttribute(
            'href',
            '/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2Fdashboard',
        );

        await userEvent.type(screen.getByLabelText('Display name'), 'Alex');
        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

        expect(await screen.findByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
            'href',
            '/login?returnTo=http%3A%2F%2Flocalhost%3A3000%2Fdashboard',
        );
    });

    it('lets the user switch back to the form after confirmation', async () => {
        signUp.mockResolvedValue({ error: null });

        render(<RegisterPage />);

        await userEvent.type(screen.getByLabelText('Display name'), 'Alex');
        await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

        await userEvent.click(await screen.findByRole('button', { name: 'Use a different email' }));

        expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    });
});
