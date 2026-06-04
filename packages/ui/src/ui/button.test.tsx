import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
    it('renders with an accessible name', () => {
        render(<Button>Sign in</Button>);
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });

    it('handles click events', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('respects the disabled state', () => {
        const onClick = vi.fn();
        render(
            <Button disabled onClick={onClick}>
                Disabled
            </Button>,
        );
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });
});
