import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/constants/routePaths';

import Page from './page';

const redirectMock = vi.fn();

vi.mock('next/navigation', () => ({
    redirect: (path: string) => redirectMock(path),
}));

describe('ChatPage', () => {
    it('redirects root route to dashboard', () => {
        render(<Page />);

        expect(redirectMock).toHaveBeenCalledWith(ROUTE_PATHS.DASHBOARD);
        expect(screen.queryByText('Recent jobs')).not.toBeInTheDocument();
    });
});
