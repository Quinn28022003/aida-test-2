import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

describe('Popover', () => {
  it('renders content when open', () => {
    render(
      <Popover open>
        <PopoverTrigger asChild>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('toggles with trigger (controlled open)', () => {
    const { rerender } = render(
      <Popover open>
        <PopoverTrigger asChild>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    rerender(
      <Popover open={false}>
        <PopoverTrigger asChild>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});

