import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport } from './toast';

describe('Toast compatibility components', () => {
  it('renders the viewport with forwarded className', () => {
    render(<ToastViewport className="custom-viewport" />);

    expect(document.querySelector('.custom-viewport')).toBeInTheDocument();
  });

  it('renders an action button and handles clicks', () => {
    const handleClick = vi.fn();

    render(
      <ToastAction altText="Retry action" onClick={handleClick}>
        Retry
      </ToastAction>,
    );

    const action = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(action);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders a close button', () => {
    render(<ToastClose />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders title and description content', () => {
    render(
      <>
        <ToastTitle>Saved</ToastTitle>
        <ToastDescription>Changes saved successfully</ToastDescription>
      </>,
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Changes saved successfully')).toBeInTheDocument();
  });
});
