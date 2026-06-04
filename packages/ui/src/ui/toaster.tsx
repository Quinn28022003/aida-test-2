'use client';

import { Toaster as SonnerToaster } from 'sonner';

import type { ToasterProps } from './toast';

export function Toaster(props: ToasterProps) {
  return <SonnerToaster closeButton position="top-center" visibleToasts={5} {...props} />;
}
