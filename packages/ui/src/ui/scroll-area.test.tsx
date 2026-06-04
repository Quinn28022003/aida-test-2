import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollArea, ScrollBar } from './scroll-area';

describe('ScrollArea', () => {
  it('renders content', () => {
    render(
      <ScrollArea>
        <div>Inner</div>
        <ScrollBar />
      </ScrollArea>
    );
    expect(screen.getByText('Inner')).toBeInTheDocument();
  });
});

