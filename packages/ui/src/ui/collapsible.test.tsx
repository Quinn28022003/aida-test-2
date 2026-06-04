import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

describe('Collapsible', () => {
  it('renders content when open', () => {
    render(
      <Collapsible open>
        <CollapsibleTrigger asChild>
          <button>Toggle</button>
        </CollapsibleTrigger>
        <CollapsibleContent>Hidden</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});

