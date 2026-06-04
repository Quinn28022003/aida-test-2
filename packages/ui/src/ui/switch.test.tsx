import { fireEvent, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders and toggles', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Switch checked={false} onCheckedChange={onChange} />);
    const el = getByRole('switch');
    expect(el).toBeInTheDocument();
    fireEvent.click(el);
    expect(onChange).toHaveBeenCalled();
  });
});

