import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with text', () => {
    const { getByText } = render(<LoadingSpinner text="Loading something" />);
    expect(getByText('Loading something')).toBeInTheDocument();
  });
});

