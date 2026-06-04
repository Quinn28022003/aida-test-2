import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordUpdatePage from './page';

const updateUser = vi.fn();
const replace = vi.fn();
const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace }),
    useSearchParams: () => new URLSearchParams('returnTo=http%3A%2F%2Flocalhost%3A3001%2Fvault'),
}));

vi.mock('@aida/config/public', () => ({
    getIdentityPublicEnv: vi.fn(() => ({
        NEXT_PUBLIC_CHAT_DOMAIN: 'http://localhost:3000',
        NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    })),
    parseCommaSeparatedOrigins: (raw: string) =>
        raw.split(',').map((origin) => origin.trim()).filter(Boolean),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
    getSupabaseClient: () => ({
        auth: { updateUser },
    }),
}));

vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);

describe('ResetPasswordUpdatePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('blocks submit when passwords are too short or do not match', async () => {
        render(<ResetPasswordUpdatePage />);

        await userEvent.type(screen.getByLabelText('New password'), 'short');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'different');
        await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

        expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        expect(updateUser).not.toHaveBeenCalled();
    });

    it('shows a form-level message when password update fails', async () => {
        updateUser.mockResolvedValue({
            error: { message: 'Reset link expired. Request a new password reset.' },
        });

        render(<ResetPasswordUpdatePage />);

        await userEvent.type(screen.getByLabelText('New password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

        expect(
            await screen.findByText('Reset link expired. Request a new password reset.'),
        ).toBeInTheDocument();
    });

    it('redirects to the resolved return destination after password update', async () => {
        updateUser.mockResolvedValue({ error: null });

        render(<ResetPasswordUpdatePage />);

        await userEvent.type(screen.getByLabelText('New password'), 'Password1!');
        await userEvent.type(screen.getByLabelText('Confirm password'), 'Password1!');
        await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

        await waitFor(() => {
            expect(updateUser).toHaveBeenCalledWith({ password: 'Password1!' });
            expect(replace).toHaveBeenCalledWith('http://localhost:3001/vault');
        });
    });
});
