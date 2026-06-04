import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { toast } from '../hooks/use-toast';
import { Toaster } from './toaster';

const sonnerToast = vi.hoisted(() => {
  const mockedToast = vi.fn(() => 'default-id');
  mockedToast.success = vi.fn(() => 'success-id');
  mockedToast.error = vi.fn(() => 'error-id');
  mockedToast.warning = vi.fn(() => 'warning-id');
  mockedToast.dismiss = vi.fn();

  return mockedToast;
});

vi.mock('sonner', () => ({
  Toaster: (props: { closeButton?: boolean; position?: string; visibleToasts?: number }) => (
    <div
      data-close-button={String(props.closeButton)}
      data-position={props.position}
      data-testid="sonner-toaster"
      data-visible-toasts={props.visibleToasts}
    />
  ),
  toast: sonnerToast,
  useSonner: () => ({ toasts: [] }),
}));

describe('Toaster', () => {
  it('renders Sonner toaster with AIDA defaults', () => {
    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');

    expect(toaster).toHaveAttribute('data-close-button', 'true');
    expect(toaster).toHaveAttribute('data-position', 'top-center');
    expect(toaster).toHaveAttribute('data-visible-toasts', '5');
  });
});

describe('toast', () => {
  it('maps success variant to Sonner success', () => {
    toast({ title: 'Saved', description: 'Profile updated', variant: 'success' });

    expect(sonnerToast.success).toHaveBeenCalledWith('Saved', {
      description: 'Profile updated',
    });
  });

  it('maps destructive variant to Sonner error', () => {
    toast({ title: 'Failed', description: 'Try again', variant: 'destructive' });

    expect(sonnerToast.error).toHaveBeenCalledWith('Failed', {
      description: 'Try again',
    });
  });

  it('maps warning variant to Sonner warning', () => {
    toast({ title: 'Careful', description: 'Check the details', variant: 'warning' });

    expect(sonnerToast.warning).toHaveBeenCalledWith('Careful', {
      description: 'Check the details',
    });
  });

  it('maps default variant to Sonner base toast', () => {
    toast({ title: 'Hello', description: 'World' });

    expect(sonnerToast).toHaveBeenCalledWith('Hello', {
      description: 'World',
    });
  });

  it('returns dismiss compatibility helper', () => {
    const createdToast = toast({ title: 'Hello' });

    createdToast.dismiss();

    expect(sonnerToast.dismiss).toHaveBeenCalledWith('default-id');
  });
});
