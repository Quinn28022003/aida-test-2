import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from './alert-dialog';

// Radix primitives are hard to test deeply in JSDOM because they rely on Portals and Layout effects.
// However, verifying exports and basic composition ensures no major configuration errors.
// We test that it renders without blowing up.

describe('AlertDialog UI Component', () => {
  it('renders trigger and content structure', () => {
    // We probably need to mock ResizeObserver for Radix if not polyfilled in setup
    global.ResizeObserver =
      global.ResizeObserver ||
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };

    const { getByText } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>Content</AlertDialogContent>
      </AlertDialog>,
    );

    expect(getByText('Open')).toBeInTheDocument();
    // Content is usually not in document until opened due to portal/state
  });
});
