import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateProject } from '@/hooks/project';
import { CreateProjectDialog } from './createProjectDialog';

const createProjectMock = vi.hoisted(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as Error | null,
}));

vi.mock('@/hooks/project', () => ({
    useCreateProject: vi.fn(),
}));

vi.mock('@aida/ui', async () => {
    const React = await import('react');
    const { Controller, FormProvider } = await import('react-hook-form');

    const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

    return {
        Button: ({ children, textLoading, loadingDots, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { textLoading?: string; loadingDots?: boolean }) => (
            <button {...props} disabled={disabled}>{loadingDots ? textLoading : children}</button>
        ),
        Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => (
            <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
        ),
        DialogContent: ({ children }: { children: React.ReactNode }) => {
            const context = React.useContext(DialogContext);
            return context?.open ? <div role="dialog">{children}</div> : null;
        },
        DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
        DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
        DialogTrigger: ({ children }: { children: React.ReactElement }) => {
            const context = React.useContext(DialogContext);
            return React.cloneElement(children, { onClick: () => context?.onOpenChange(true) });
        },
        Form: ({ children, ...methods }: { children: React.ReactNode }) => (
            <FormProvider {...(methods as Parameters<typeof FormProvider>[0])}>{children}</FormProvider>
        ),
        InputField: ({
            control,
            name,
            label,
            disabled,
            hideFieldMessage,
        }: {
            control: never;
            name: string;
            label: string;
            disabled?: boolean;
            hideFieldMessage?: boolean;
        }) => (
            <Controller
                control={control}
                name={name}
                render={({ field, fieldState }) => (
                    <label>
                        {label}
                        <input aria-label={label} disabled={disabled} {...field} />
                        {fieldState.error && !hideFieldMessage ? <span>{fieldState.error.message}</span> : null}
                    </label>
                )}
            />
        ),
        TextareaField: ({ control, name, label }: { control: never; name: string; label: string }) => (
            <Controller
                control={control}
                name={name}
                render={({ field }) => (
                    <label>
                        {label}
                        <textarea aria-label={label} {...field} />
                    </label>
                )}
            />
        ),
    };
});

describe('CreateProjectDialog', () => {
    beforeEach(() => {
        createProjectMock.mutate.mockReset();
        createProjectMock.isPending = false;
        createProjectMock.isError = false;
        createProjectMock.error = null;
        vi.mocked(useCreateProject).mockImplementation((options) => {
            createProjectMock.mutate.mockImplementation((values) => {
                options?.onSuccess?.({ id: 'project-1' } as never, values);
            });
            return createProjectMock as never;
        });
    });

    it('opens without showing a project key error', () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));

        expect(screen.queryByText('Project key is required.')).not.toBeInTheDocument();
    });

    it('validates required project name without showing a project key error', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));

        const form = screen.getByRole('dialog').querySelector('form');
        if (form) {
            fireEvent.submit(form);
        }

        expect(await screen.findByText('Project name is required.')).toBeInTheDocument();
        expect(screen.queryByText('Project key is required.')).not.toBeInTheDocument();
        expect(createProjectMock.mutate).not.toHaveBeenCalled();
    });

    it('has Project key field disabled', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));

        const keyInput = screen.getByLabelText('Project key');
        expect(keyInput).toBeDisabled();
    });

    it('does not update key before 500ms debounce', () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Kitchen' } });

        const keyInput = screen.getByLabelText('Project key') as HTMLInputElement;
        expect(keyInput.value).toBe('');
    });

    it('updates key after 500ms debounce with slug and random suffix', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Kitchen' } });

        await waitFor(
            () => {
                const keyInput = screen.getByLabelText('Project key') as HTMLInputElement;
                expect(keyInput.value).toMatch(/^kitchen-[a-z0-9]{11}$/);
            },
            { timeout: 700 },
        );
    });

    it('submits with generated key without manually changing the key field', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Kitchen' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Renovation' } });

        await waitFor(
            () => {
                const keyInput = screen.getByLabelText('Project key') as HTMLInputElement;
                expect(keyInput.value).toMatch(/^kitchen-[a-z0-9]{11}$/);
            },
            { timeout: 700 },
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => {
            expect(createProjectMock.mutate).toHaveBeenCalled();
        });

        // Verify the submitted key matches the expected pattern
        const callArgs = createProjectMock.mutate.mock.calls[0][0];
        expect(callArgs.orgId).toBe('org-1');
        expect(callArgs.name).toBe('Kitchen');
        expect(callArgs.key).toMatch(/^kitchen-[a-z0-9]{11}$/);
        expect(callArgs.description).toBe('Renovation');
    });

    it('disables save button while key generation is pending', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Kitchen' } });

        const saveButton = screen.getByRole('button', { name: 'Save' });
        expect(saveButton).toBeDisabled();

        await waitFor(() => expect(saveButton).not.toBeDisabled(), { timeout: 700 });
    });

    it('disables save button while project creation is pending', async () => {
        createProjectMock.isPending = true;

        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));

        await waitFor(
            () => {
                expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
            },
            { timeout: 700 },
        );

        const saveButton = screen.getByRole('button', { name: 'Saving' });
        expect(saveButton).toBeDisabled();
    });

    it('shows a project name error when the name cannot generate a key', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: '___' } });
        await waitFor(
            () => {
                const keyInput = screen.getByLabelText('Project key') as HTMLInputElement;
                expect(keyInput.value).toBe('');
            },
            { timeout: 700 },
        );

        const form = screen.getByRole('dialog').querySelector('form');
        if (form) {
            fireEvent.submit(form);
        }

        expect(await screen.findByText('Project name must include letters or numbers.')).toBeInTheDocument();
        expect(screen.queryByText('Project key is required.')).not.toBeInTheDocument();
        expect(createProjectMock.mutate).not.toHaveBeenCalled();
    });

    it('shows mutation errors', () => {
        createProjectMock.isError = true;
        createProjectMock.error = new Error('Could not create');

        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));

        expect(screen.getByText('Could not create')).toBeInTheDocument();
    });

    it('submits with a generated key even when debounce has not finished', async () => {
        render(<CreateProjectDialog orgId="org-1" />);

        fireEvent.click(screen.getByRole('button', { name: 'Start new project' }));
        fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Kitchen' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Renovation' } });

        // Submit immediately without waiting for debounce
        const form = screen.getByRole('dialog').querySelector('form');
        if (form) {
            fireEvent.submit(form);
        }

        // Should still submit with a generated key matching the pattern
        await waitFor(() => {
            expect(createProjectMock.mutate).toHaveBeenCalled();
        });

        const callArgs = createProjectMock.mutate.mock.calls[0][0];
        expect(callArgs.orgId).toBe('org-1');
        expect(callArgs.name).toBe('Kitchen');
        expect(callArgs.key).toMatch(/^kitchen-[a-z0-9]{11}$/);
        expect(callArgs.description).toBe('Renovation');
    });
});
