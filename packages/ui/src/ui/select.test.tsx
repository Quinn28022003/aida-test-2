import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  it('renders trigger and content (open)', () => {
    render(
      <Select defaultOpen value="1">
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">One</SelectItem>
          <SelectItem value="2">Two</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByLabelText('select')).toBeInTheDocument();
    expect(screen.getAllByText('One').length).toBeGreaterThan(0);
  });
});
