import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CollapsibleJsonEditor } from './CollapsibleJsonEditor';

describe('CollapsibleJsonEditor', () => {
    const user = userEvent.setup();

    it('renders label and toggle button', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('JSON Config')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('shows "Show" when collapsed and "Hide" when expanded', async () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={vi.fn()}
            />
        );

        const toggleButton = screen.getByRole('button');
        expect(screen.getByText('Show')).toBeInTheDocument();

        await user.click(toggleButton);
        expect(screen.getByText('Hide')).toBeInTheDocument();

        await user.click(toggleButton);
        expect(screen.getByText('Show')).toBeInTheDocument();
    });

    it('opens by default when defaultOpen is true', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{ key: 'value' }}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        expect(screen.getByText('Hide')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('formats and displays JSON value in textarea', () => {
        const value = { name: 'test', count: 42 };

        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={value}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(JSON.stringify(value, null, 2));
    });

    it('shows empty string for null value', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={null}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
    });

    it('shows empty string for undefined value', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={undefined}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
    });

    it('calls onChange with parsed JSON when valid JSON is entered', async () => {
        const onChange = vi.fn();

        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={onChange}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        await user.clear(textarea);
        fireEvent.change(textarea, { target: { value: '{"newKey": "newValue"}' } });

        expect(onChange).toHaveBeenCalledWith({ newKey: 'newValue' });
    });

    it('calls onChange with undefined when textarea is empty', async () => {
        const onChange = vi.fn();

        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{ key: 'value' }}
                onChange={onChange}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        await user.clear(textarea);

        expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('does not call onChange when invalid JSON is entered', async () => {
        const onChange = vi.fn();

        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={onChange}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        await user.clear(textarea);
        onChange.mockClear();

        fireEvent.change(textarea, { target: { value: '{invalid json}' } });

        // onChange should not be called for invalid JSON
        expect(onChange).not.toHaveBeenCalled();
        // But the text should still be in the textarea (draft state)
        expect(textarea).toHaveValue('{invalid json}');
    });

    it('updates textarea when value prop changes', () => {
        const { rerender } = render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{ initial: 'value' }}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(JSON.stringify({ initial: 'value' }, null, 2));

        rerender(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{ updated: 'value' }}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        expect(textarea).toHaveValue(JSON.stringify({ updated: 'value' }, null, 2));
    });

    it('disables toggle button and textarea when disabled is true', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={vi.fn()}
                defaultOpen={true}
                disabled={true}
            />
        );

        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('uses custom placeholder', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={undefined}
                onChange={vi.fn()}
                defaultOpen={true}
                placeholder="Enter JSON here"
            />
        );

        expect(screen.getByPlaceholderText('Enter JSON here')).toBeInTheDocument();
    });

    it('uses custom rows for textarea', () => {
        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={{}}
                onChange={vi.fn()}
                defaultOpen={true}
                rows={10}
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveAttribute('rows', '10');
    });

    it('handles circular reference gracefully in formatJsonValue', () => {
        const circular: Record<string, unknown> = { name: 'test' };
        circular.self = circular;

        render(
            <CollapsibleJsonEditor
                label="JSON Config"
                value={circular}
                onChange={vi.fn()}
                defaultOpen={true}
            />
        );

        // Should not throw, and should show empty string when JSON.stringify fails
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
    });
});
