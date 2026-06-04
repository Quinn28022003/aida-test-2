import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { MultiSelect, type SelectOption } from './MultiSelect';

const mockOptions: SelectOption[] = [
    { key: 'admin', label: 'Admin', description: 'Administrator role' },
    { key: 'editor', label: 'Editor', description: 'Editor role' },
    { key: 'viewer', label: 'Viewer' },
];

describe('MultiSelect', () => {
    const user = userEvent.setup();

    it('renders with placeholder when no values selected', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
                placeholder="Select options..."
            />
        );

        expect(screen.getByText('Select options...')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
            />
        );

        expect(screen.getByText('Select options...')).toBeInTheDocument();
    });

    it('displays selected value labels', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin']}
                onValueChange={vi.fn()}
            />
        );

        expect(screen.getByRole('combobox', { name: 'Admin' })).toBeInTheDocument();
    });

    it('displays multiple selected values separated by comma', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin', 'editor']}
                onValueChange={vi.fn()}
            />
        );

        expect(screen.getByRole('combobox', { name: 'Admin, Editor' })).toBeInTheDocument();
    });

    it('truncates display when more than maxDisplayCount values selected', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin', 'editor', 'viewer']}
                onValueChange={vi.fn()}
                maxDisplayCount={2}
            />
        );

        expect(screen.getByRole('combobox', { name: 'Admin, Editor +1' })).toBeInTheDocument();
    });

    it('opens dropdown and shows all options', async () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Editor')).toBeInTheDocument();
        expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('shows option descriptions when available', async () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        expect(screen.getByText('Administrator role')).toBeInTheDocument();
        expect(screen.getByText('Editor role')).toBeInTheDocument();
    });

    it('calls onValueChange when selecting an option', async () => {
        const onValueChange = vi.fn();

        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={onValueChange}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        const adminOption = screen.getByRole('checkbox', { name: /admin/i });
        await user.click(adminOption);

        expect(onValueChange).toHaveBeenCalledWith(['admin']);
    });

    it('calls onValueChange when deselecting an option', async () => {
        const onValueChange = vi.fn();

        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin', 'editor']}
                onValueChange={onValueChange}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        const adminOption = screen.getByRole('checkbox', { name: /admin/i });
        await user.click(adminOption);

        expect(onValueChange).toHaveBeenCalledWith(['editor']);
    });

    it('does not allow deselecting required values', async () => {
        const onValueChange = vi.fn();

        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin', 'editor']}
                onValueChange={onValueChange}
                requiredValues={['admin']}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        const adminOption = screen.getByRole('checkbox', { name: /admin/i });
        expect(adminOption).toBeDisabled();

        await user.click(adminOption);

        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('disables the combobox when disabled prop is true', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
                disabled={true}
            />
        );

        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('disables the combobox when isLoading prop is true', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
                isLoading={true}
            />
        );

        expect(screen.getByRole('combobox')).toBeDisabled();
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('applies custom className to trigger button', () => {
        const { container } = render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
                className="custom-class"
            />
        );

        const button = container.querySelector('.custom-class');
        expect(button).toBeInTheDocument();
    });

    it('marks selected options with aria-checked true', async () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin']}
                onValueChange={vi.fn()}
            />
        );

        const combobox = screen.getByRole('combobox');
        await user.click(combobox);

        const adminOption = screen.getByRole('checkbox', { name: /admin/i });
        const editorOption = screen.getByRole('checkbox', { name: /editor/i });

        expect(adminOption).toHaveAttribute('aria-checked', 'true');
        expect(editorOption).toHaveAttribute('aria-checked', 'false');
    });

    it('has correct aria attributes on combobox', () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={['admin']}
                onValueChange={vi.fn()}
            />
        );

        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');
        expect(combobox).toHaveAttribute('aria-label', 'Admin');
    });

    it('updates aria-expanded when dropdown opens', async () => {
        render(
            <MultiSelect
                options={mockOptions}
                selectedValues={[]}
                onValueChange={vi.fn()}
            />
        );

        const combobox = screen.getByRole('combobox');
        expect(combobox).toHaveAttribute('aria-expanded', 'false');

        await user.click(combobox);

        expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
});