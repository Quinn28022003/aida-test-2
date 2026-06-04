import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders checkbox', () => {
    const { getByRole } = render(<Checkbox />);
    expect(getByRole('checkbox')).toBeInTheDocument();
  });
});

