import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sheet, SheetContent, SheetTrigger } from './sheet';

describe('Sheet', () => {
  it('renders content when open', () => {
    render(
      <Sheet open>
        <SheetTrigger asChild>
          <button>Open</button>
        </SheetTrigger>
        <SheetContent>Panel</SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });
});

