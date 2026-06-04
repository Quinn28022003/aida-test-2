import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/constants/routePaths';
import { useCreateConversation, useCreateJob } from '@/hooks/project';
import { ProjectService } from '@/services/project.service';
import { createQueryWrapper } from '@/test/test-utils';
import { CreateConversationDialog } from './createConversationDialog';
import { CreateJobDialog } from './createJobDialog';

const routerPush = vi.hoisted(() => vi.fn());
const createJobMock = vi.hoisted(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as Error | null,
}));
const createConversationMock = vi.hoisted(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as Error | null,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: routerPush,
    }),
}));

vi.mock('@/hooks/project', () => ({
    useCreateConversation: vi.fn(),
    useCreateJob: vi.fn(),
}));

vi.mock('@/services/project.service', () => ({
    ProjectService: {
        listMembers: vi.fn(),
    },
}));

vi.mock('@aida/ui', async () => {
    const React = await import('react');
    const { Controller, FormProvider } = await import('react-hook-form');

    const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null);

    return {
        Button: ({ children, textLoading, loadingDots, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { textLoading?: string; loadingDots?: boolean }) => (
            <button {...props}>{loadingDots ? textLoading : children}</button>
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
        InputField: ({ control, name, label }: { control: never; name: string; label: string }) => (
            <Controller
                control={control}
                name={name}
                render={({ field, fieldState }) => (
                    <label>
                        {label}
                        <input aria-label={label} {...field} />
                        {fieldState.error ? <span>{fieldState.error.message}</span> : null}
                    </label>
                )}
            />
        ),
        SelectField: ({
            control,
            name,
            label,
            options,
        }: {
            control: never;
            name: string;
            label: string;
            options: Array<{ value: string; label: string }>;
        }) => (
            <Controller
                control={control}
                name={name}
                render={({ field, fieldState }) => (
                    <label>
                        {label}
                        <select aria-label={label} {...field}>
                            <option value="">Select</option>
                            {options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {fieldState.error ? <span>{fieldState.error.message}</span> : null}
                    </label>
                )}
            />
        ),
    };
});

const orgId = 'org-1';
const projectId = 'project-1';
const jobId = 'job-1';
const customerProfileId = '00000000-0000-4000-8000-000000000001';

describe('CreateJobDialog', () => {
    beforeEach(() => {
        routerPush.mockReset();
        createJobMock.mutate.mockReset();
        createJobMock.isPending = false;
        createJobMock.isError = false;
        createJobMock.error = null;
        vi.mocked(ProjectService.listMembers).mockReset();
        vi.mocked(useCreateJob).mockImplementation((options) => {
            createJobMock.mutate.mockImplementation((values) => {
                options?.onSuccess?.({ id: jobId } as never, values);
            });
            return createJobMock as never;
        });
    });

    it('fetches members only when opened and disables submit when no members exist', async () => {
        vi.mocked(ProjectService.listMembers).mockResolvedValue([]);

        render(
            <CreateJobDialog
                orgId={orgId}
                projectId={projectId}
                trigger={<button type="button">Open job</button>}
            />,
            { wrapper: createQueryWrapper() },
        );

        expect(ProjectService.listMembers).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Open job' }));

        await waitFor(() => expect(ProjectService.listMembers).toHaveBeenCalledWith(projectId));
        expect(screen.getByRole('button', { name: 'Create job ticket' })).toBeDisabled();
    });

    it('submits a selected customer and navigates on success', async () => {
        vi.mocked(ProjectService.listMembers).mockResolvedValue([
            {
                id: 'member-1',
                userId: customerProfileId,
            },
        ] as Awaited<ReturnType<typeof ProjectService.listMembers>>);

        render(
            <CreateJobDialog
                orgId={orgId}
                projectId={projectId}
                trigger={<button type="button">Open job</button>}
            />,
            { wrapper: createQueryWrapper() },
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open job' }));
        await screen.findByText(`Member ${customerProfileId.slice(0, 8)}`);
        fireEvent.change(screen.getByLabelText('Client name'), { target: { value: 'Carly Jones' } });
        fireEvent.change(screen.getByLabelText('Customer'), { target: { value: customerProfileId } });
        fireEvent.click(screen.getByRole('button', { name: 'Create job ticket' }));

        await waitFor(() => {
            expect(createJobMock.mutate).toHaveBeenCalledWith({
                projectId,
                title: 'Carly Jones',
                customerProfileId,
            });
        });
        expect(routerPush).toHaveBeenCalledWith(ROUTE_PATHS.ProjectWorkspace(orgId, projectId, { jobId }));
    });

    it('shows job creation errors', () => {
        createJobMock.isError = true;
        createJobMock.error = new Error('Could not create job');
        vi.mocked(ProjectService.listMembers).mockResolvedValue([]);

        render(
            <CreateJobDialog
                orgId={orgId}
                projectId={projectId}
                trigger={<button type="button">Open job</button>}
            />,
            { wrapper: createQueryWrapper() },
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open job' }));

        expect(screen.getByText('Could not create job')).toBeInTheDocument();
    });
});

describe('CreateConversationDialog', () => {
    beforeEach(() => {
        createConversationMock.mutate.mockReset();
        createConversationMock.isPending = false;
        createConversationMock.isError = false;
        createConversationMock.error = null;
        vi.mocked(useCreateConversation).mockImplementation((options) => {
            createConversationMock.mutate.mockImplementation((values) => {
                options?.onSuccess?.({}, values);
            });
            return createConversationMock as never;
        });
    });

    it('resets the default title when opened', () => {
        render(
            <CreateConversationDialog
                orgId={orgId}
                projectId={projectId}
                jobId={jobId}
                defaultTitle="Tax thread"
                trigger={<button type="button">Open conversation</button>}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open conversation' }));

        expect(screen.getByLabelText('Title')).toHaveValue('Tax thread');
    });

    it('validates and submits the title, then closes on success', async () => {
        render(
            <CreateConversationDialog
                orgId={orgId}
                projectId={projectId}
                jobId={jobId}
                trigger={<button type="button">Open conversation</button>}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open conversation' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start conversation' }));
        expect(await screen.findByText('Title is required.')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Tax thread' } });
        fireEvent.click(screen.getByRole('button', { name: 'Start conversation' }));

        await waitFor(() => {
            expect(createConversationMock.mutate).toHaveBeenCalledWith({
                orgId,
                projectId,
                jobId,
                title: 'Tax thread',
            });
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows conversation creation errors', () => {
        createConversationMock.isError = true;
        createConversationMock.error = new Error('Could not create conversation');

        render(
            <CreateConversationDialog
                orgId={orgId}
                projectId={projectId}
                jobId={jobId}
                trigger={<button type="button">Open conversation</button>}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open conversation' }));

        expect(screen.getByText('Could not create conversation')).toBeInTheDocument();
    });
});
