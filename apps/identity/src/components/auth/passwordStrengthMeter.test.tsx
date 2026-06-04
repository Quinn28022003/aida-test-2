import { Form } from '@aida/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { PasswordStrengthMeter } from './passwordStrengthMeter';

function TestHarness() {
    const form = useForm({ defaultValues: { password: '' } });

    return (
        <Form {...form}>
            <input aria-label="Password" {...form.register('password')} />
            <PasswordStrengthMeter />
        </Form>
    );
}

describe('PasswordStrengthMeter', () => {
    it('is hidden when the password field is empty', () => {
        render(<TestHarness />);

        expect(screen.queryByText(/Must contain:/)).not.toBeInTheDocument();
    });

    it('shows strength headline, bar, and requirement checklist while typing', async () => {
        render(<TestHarness />);

        await userEvent.type(screen.getByLabelText('Password'), 'Password1!');

        expect(screen.getByText('Strong', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('Must contain:')).toBeInTheDocument();
        expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
        expect(screen.getByText('At least 1 special character')).toBeInTheDocument();
        const progressbar = screen.getByRole('progressbar', { name: 'Password strength: Strong' });
        expect(progressbar).toBeInTheDocument();
        expect(progressbar).toHaveAttribute('aria-valuenow', '5');
        expect(progressbar.children).toHaveLength(5);
    });

    it('marks unmet rules with muted styling and met rules as satisfied', async () => {
        render(<TestHarness />);

        await userEvent.type(screen.getByLabelText('Password'), '12345678');

        expect(screen.getByText('Medium', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('Must contain:')).toBeInTheDocument();

        const uppercaseItem = screen.getByText('At least 1 uppercase letter').closest('li');
        const numberItem = screen.getByText('At least 1 number').closest('li');

        expect(uppercaseItem).toHaveClass('text-muted-foreground');
        expect(numberItem).toHaveClass('text-green-600');
    });
});
