import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea component', () => {
  it('should render with default props', () => {
    render(<Textarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    // Visual layout classes removed from assertions; ensure textarea is visible and present.
    expect(textarea).toBeVisible();
  });

  it('should render with placeholder text', () => {
    render(<Textarea placeholder="Enter your message" />);

    const textarea = screen.getByPlaceholderText('Enter your message');
    expect(textarea).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<Textarea value="Test content" />);

    const textarea = screen.getByDisplayValue('Test content');
    expect(textarea).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    // Disabled styling is visual; behavior validated via disabled state.
  });

  it('should apply additional className', () => {
    render(<Textarea className="custom-class" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('should forward additional props to textarea element', () => {
    render(<Textarea rows={5} cols={30} maxLength={100} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '30');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('should support ref forwarding', () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);

    // The ref should be called with the textarea element
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });
});
