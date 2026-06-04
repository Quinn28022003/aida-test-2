import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('renders with default value', () => {
    const { container } = render(<Slider defaultValue={[25]} />);
    expect(container.firstChild).toBeTruthy();
  });
});

