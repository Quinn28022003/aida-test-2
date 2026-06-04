'use client';

import { X } from 'lucide-react';
import * as React from 'react';
import type { ExternalToast, ToasterProps } from 'sonner';

import { cn } from '../lib/cn';

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning';

type ToastProps = ExternalToast & {
  title?: React.ReactNode;
  variant?: ToastVariant;
  isShowIcon?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToastActionElement = React.ReactElement;

function ToastProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />,
);
ToastViewport.displayName = 'ToastViewport';

const Toast = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & ToastProps>(
  (
    {
      action: _action,
      cancel: _cancel,
      closeButton: _closeButton,
      description: _description,
      duration: _duration,
      id: _id,
      isShowIcon: _isShowIcon,
      onAutoClose: _onAutoClose,
      onDismiss: _onDismiss,
      onOpenChange: _onOpenChange,
      open: _open,
      position: _position,
      title: _title,
      variant: _variant,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    void _action;
    void _cancel;
    void _closeButton;
    void _description;
    void _duration;
    void _id;
    void _isShowIcon;
    void _onAutoClose;
    void _onDismiss;
    void _onOpenChange;
    void _open;
    void _position;
    void _title;
    void _variant;

    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  },
);
Toast.displayName = 'Toast';

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { altText: string }
>(({ className, altText: _altText, ...props }, ref) => {
  void _altText;

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'rounded-md p-1 text-foreground/50 transition-opacity hover:text-foreground focus:outline-none focus:ring-2',
        className,
      )}
      {...props}
    >
      {children ?? <X className="h-4 w-4" />}
    </button>
  ),
);
ToastClose.displayName = 'ToastClose';

const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm font-semibold', className)} {...props} />,
);
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm opacity-90', className)} {...props} />,
);
ToastDescription.displayName = 'ToastDescription';

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
  type ToasterProps,
};
