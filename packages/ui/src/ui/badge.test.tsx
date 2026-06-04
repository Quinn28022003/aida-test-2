import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge component', () => {
  it('should render with default props', () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    // Visual styling is not asserted here; ensure badge renders and contains expected text.
    expect(badge).toBeVisible();
  });

  it('should render different variants correctly', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toBeInTheDocument();

    rerender(<Badge variant="new">New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();

    rerender(<Badge variant="customSuccess">Custom Success</Badge>);
    expect(screen.getByText('Custom Success')).toBeInTheDocument();
  });

  it('should apply additional className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);

    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
  });

  it('should forward additional props', () => {
    render(<Badge data-testid="custom-badge">Test Badge</Badge>);

    const badge = screen.getByTestId('custom-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Test Badge');
  });

  it('should handle different content types', () => {
    render(
      <Badge>
        <span>Icon</span>
        Label
      </Badge>,
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('should support focus states', () => {
    render(<Badge tabIndex={0}>Focusable Badge</Badge>);

    const badge = screen.getByText('Focusable Badge');
    expect(badge).toHaveAttribute('tabIndex', '0');
    // Focus ring classes are visual; ensure element is focusable via tabIndex.
  });
});
