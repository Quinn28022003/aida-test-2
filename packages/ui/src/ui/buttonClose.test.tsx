import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ButtonClose } from './buttonClose';

describe('ButtonClose', () => {
    it('calls onClose when clicked', () => {
        const onClose = vi.fn();
        render(<ButtonClose onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled is true', () => {
        render(<ButtonClose onClose={vi.fn()} disabled />);
        expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    });
});
