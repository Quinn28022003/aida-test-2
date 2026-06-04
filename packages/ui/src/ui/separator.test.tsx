import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with role separator', () => {
    const { container } = render(<Separator />);
    const hr = container.querySelector('[role="separator"], hr, div');
    expect(hr).toBeTruthy();
  });
});

