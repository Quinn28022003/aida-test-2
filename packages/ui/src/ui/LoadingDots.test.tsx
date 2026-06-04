import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingDots } from './LoadingDots';

describe('LoadingDots component', () => {
  it('shows default loading text', () => {
    render(<LoadingDots />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows custom text', () => {
    render(<LoadingDots text="Saving..." />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('hides text when notText is true', () => {
    render(<LoadingDots notText />);
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('shows loading animation dots', () => {
    render(<LoadingDots />);
    const dots = screen.getAllByText('.');
    expect(dots).toHaveLength(3);
  });

  it('shows dots without text', () => {
    render(<LoadingDots notText />);
    const dots = screen.getAllByText('.');
    expect(dots).toHaveLength(3);
  });
});
