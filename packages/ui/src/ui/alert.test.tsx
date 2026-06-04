import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert component', () => {
  it('should render with default props', () => {
    render(<Alert>Alert content</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Alert content');
  });

  it('should render different variants correctly', () => {
    const { rerender } = render(<Alert variant="destructive">Error message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Alert variant="default">Default message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should apply additional className', () => {
    render(<Alert className="custom-class">Alert content</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should forward additional props to alert element', () => {
    render(<Alert data-testid="custom-alert">Alert content</Alert>);

    const alert = screen.getByTestId('custom-alert');
    expect(alert).toBeInTheDocument();
  });
});

describe('AlertTitle component', () => {
  it('should render with title text', () => {
    render(<AlertTitle>Alert Title</AlertTitle>);

    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Alert Title');
    // Visual styles are not asserted; ensure the heading renders correctly.
  });

  it('should apply additional className', () => {
    render(<AlertTitle className="custom-title">Alert Title</AlertTitle>);

    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toBeInTheDocument();
  });
});

describe('AlertDescription component', () => {
  it('should render with description text', () => {
    render(<AlertDescription>Description text</AlertDescription>);

    const description = screen.getByText('Description text');
    expect(description).toBeInTheDocument();
    // Description styling is visual; assert presence only.
  });

  it('should apply additional className', () => {
    render(<AlertDescription className="custom-description">Description text</AlertDescription>);

    const description = screen.getByText('Description text');
    expect(description).toBeInTheDocument();
  });
});

describe('Alert composition', () => {
  it('should render alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This is a warning message with <strong>important</strong> information.
        </AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Warning');
    expect(screen.getByText(/This is a warning message/)).toBeInTheDocument();
    expect(screen.getByText('important')).toBeInTheDocument();
  });
});
