'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Form,
    InputField,
    SelectField,
} from '@aida/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { projectMembersQueryKey } from '@/constants/queryKeys';
import { ROUTE_PATHS } from '@/constants/routePaths';
import { useCreateJob } from '@/hooks/project';
import { ProjectService } from '@/services/project.service';

const createJobFormSchema = z.object({
    title: z.string().min(1, 'Client name is required.'),
    customerProfileId: z.string().min(1, 'Please select a customer.'),
});

type CreateJobForm = z.infer<typeof createJobFormSchema>;

type CreateJobDialogProps = {
    orgId: string;
    projectId: string;
    trigger: React.ReactNode;
};

export function CreateJobDialog({ orgId, projectId, trigger }: CreateJobDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const membersQuery = useQuery({
        queryKey: projectMembersQueryKey(projectId),
        queryFn: () => ProjectService.listMembers(projectId),
        enabled: isOpen,
    });

    const customerOptions = useMemo(
        () =>
            (membersQuery.data ?? []).map((member) => ({
                value: member.userId,
                label: `Member ${member.userId.slice(0, 8)}`,
            })),
        [membersQuery.data],
    );

    const form = useForm<CreateJobForm>({
        resolver: zodResolver(createJobFormSchema),
        defaultValues: {
            title: '',
            customerProfileId: '',
        },
    });

    const createJobMutation = useCreateJob({
        onSuccess: (job) => {
            setIsOpen(false);
            form.reset();
            router.push(ROUTE_PATHS.ProjectWorkspace(orgId, projectId, { jobId: job.id }));
        },
    });

    const onSubmit = (values: CreateJobForm) => {
        createJobMutation.mutate({
            projectId,
            title: values.title,
            customerProfileId: values.customerProfileId,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader className="border-none px-0">
                    <div>
                        <DialogTitle>Create job ticket</DialogTitle>
                        <DialogDescription>Add a new client job ticket to this project.</DialogDescription>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <InputField control={form.control} name="title" label="Client name" required />
                        <SelectField
                            control={form.control}
                            name="customerProfileId"
                            label="Customer"
                            placeholder="Select a customer"
                            options={customerOptions}
                            required
                        />
                        {membersQuery.isError && (
                            <p className="text-sm text-destructive">Could not load project members.</p>
                        )}
                        {createJobMutation.isError && (
                            <p className="text-sm text-destructive">
                                {createJobMutation.error instanceof Error
                                    ? createJobMutation.error.message
                                    : 'Could not create the job ticket.'}
                            </p>
                        )}
                        <DialogFooter className="flex items-center justify-end gap-2 border-none px-0 pt-0">
                            <Button
                                type="submit"
                                disabled={createJobMutation.isPending || customerOptions.length === 0}
                                textLoading="Creating"
                                loadingDots={createJobMutation.isPending}
                            >
                                Create job ticket
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
