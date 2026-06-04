import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('renders with text and htmlFor', () => {
    render(<Label htmlFor="field">My Label</Label>);
    const el = screen.getByText('My Label');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('for', 'field');
  });
});
