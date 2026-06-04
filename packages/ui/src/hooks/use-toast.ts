'use client';

import { toast as sonnerToast, useSonner } from 'sonner';

import type { ToastProps } from '../ui/toast';

type Toast = ToastProps;

function getToastMethod(variant: Toast['variant']) {
  if (variant === 'success') {
    return sonnerToast.success;
  }

  if (variant === 'destructive') {
    return sonnerToast.error;
  }

  if (variant === 'warning') {
    return sonnerToast.warning;
  }

  return sonnerToast;
}

function toast({ title, variant, isShowIcon: _isShowIcon, open: _open, onOpenChange: _onOpenChange, ...props }: Toast) {
  void _isShowIcon;
  void _open;
  void _onOpenChange;

  const id = getToastMethod(variant)(title, props);

  const dismiss = () => {
    sonnerToast.dismiss(id);
  };

  const update = (next: Toast & { id?: string | number }) => {
    const { title: nextTitle, variant: nextVariant, ...nextProps } = next;
    getToastMethod(nextVariant ?? variant)(nextTitle, {
      ...nextProps,
      id,
    });
  };

  return { id, dismiss, update };
}

function useToast() {
  const { toasts } = useSonner();

  return {
    toasts,
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { toast, useToast };
