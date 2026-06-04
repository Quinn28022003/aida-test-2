import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RadioGroup } from './radio-group';

describe('RadioGroup', () => {
  it('renders items', () => {
    render(
      <RadioGroup defaultValue="a">
        <div role="radio" aria-checked="true">A</div>
        <div role="radio" aria-checked="false">B</div>
      </RadioGroup>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

