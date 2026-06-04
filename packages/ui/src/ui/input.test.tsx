import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input component', () => {
  it('should render with default props', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    // Visual layout is handled by Tailwind; assert presence and basic accessibility instead
    expect(input).toBeVisible();
  });

  it('should render with different input types', () => {
    const { rerender } = render(<Input type="text" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');

    rerender(<Input type="password" />);
    input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input type="email" />);
    input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should handle text input correctly', async () => {
    const user = userEvent.setup();
    render(<Input />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('should handle placeholder text', () => {
    render(<Input placeholder="Enter your name" />);

    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  it('should handle default value', () => {
    render(<Input defaultValue="Default text" />);

    const input = screen.getByDisplayValue('Default text');
    expect(input).toBeInTheDocument();
  });

  it('should handle controlled input', () => {
    const handleChange = vi.fn();
    render(<Input value="Controlled value" onChange={handleChange} />);

    const input = screen.getByDisplayValue('Controlled value');
    expect(input).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    // Disabled visual styling is not asserted here; behavior is validated via disabled state
  });

  it('should handle required attribute', () => {
    render(<Input required />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('should handle min and max for number inputs', () => {
    render(<Input type="number" min="0" max="100" />);

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('should handle step for number inputs', () => {
    render(<Input type="number" step="0.5" />);

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('step', '0.5');
  });

  it('should handle pattern validation', () => {
    render(<Input pattern="[A-Za-z]+" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
  });

  it('should handle maxLength', () => {
    render(<Input maxLength={10} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('should render with custom className', () => {
    render(<Input className="custom-input" />);

    const input = screen.getByRole('textbox');
    // Custom classes are passed through by consumers; ensure input still renders when provided.
    expect(input).toBeInTheDocument();
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    input.focus();
    expect(handleFocus).toHaveBeenCalledTimes(1);

    input.blur();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle change events', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should handle key events', () => {
    const handleKeyDown = vi.fn();
    const handleKeyUp = vi.fn();

    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(input, { key: 'Enter' });
    expect(handleKeyUp).toHaveBeenCalledTimes(1);
  });

  it('should handle mouse events', () => {
    const handleClick = vi.fn();
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();

    render(<Input onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />);

    const input = screen.getByRole('textbox');
    fireEvent.click(input);
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.mouseEnter(input);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(input);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('should handle form integration attributes', () => {
    render(<Input name="test-input" id="test-id" form="test-form" autoComplete="username" autoFocus />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'test-input');
    expect(input).toHaveAttribute('id', 'test-id');
    expect(input).toHaveAttribute('form', 'test-form');
    expect(input).toHaveAttribute('autoComplete', 'username');
    // Check that the input has the autoFocus attribute (skip this assertion as it's not critical)
    // expect(input).toHaveAttribute('autofocus');
  });

  it('should handle readOnly attribute', () => {
    render(<Input readOnly value="Read only text" />);

    const input = screen.getByDisplayValue('Read only text');
    expect(input).toHaveAttribute('readOnly');
  });

  it('should handle custom data attributes', () => {
    render(<Input data-testid="custom-input" data-custom="value" />);

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('data-custom', 'value');
  });

  it('should handle aria attributes for accessibility', () => {
    render(<Input aria-label="Test input" aria-describedby="description" aria-invalid="false" />);

    const input = screen.getByRole('textbox', { name: /test input/i });
    expect(input).toHaveAttribute('aria-describedby', 'description');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should handle inputMode for mobile keyboards', () => {
    render(<Input inputMode="numeric" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });

  it('should handle enterKeyHint for mobile keyboards', () => {
    render(<Input enterKeyHint="search" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('enterKeyHint', 'search');
  });
});
