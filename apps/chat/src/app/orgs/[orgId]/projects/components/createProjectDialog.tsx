'use client';

import { buildSlugWithSuffix } from '@aida/shared';
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
    TextareaField,
} from '@aida/ui';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useCreateProject } from '@/hooks/project';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required.'),
    key: z.string(),
    description: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

type CreateProjectDialogProps = {
    orgId: string;
};

export function CreateProjectDialog({ orgId }: CreateProjectDialogProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const form = useForm<CreateProjectForm>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            key: '',
            description: '',
        },
    });

    const nameValue = useWatch({ control: form.control, name: 'name' });
    const { debouncedValue: debouncedName, isDebouncing } = useDebouncedValue(nameValue);

    const createProjectMutation = useCreateProject({
        onSuccess: () => {
            setIsCreateOpen(false);
            form.reset({
                name: '',
                key: '',
                description: '',
            });
        },
    });

    useEffect(() => {
        const generatedKey = buildSlugWithSuffix(debouncedName);
        form.setValue('key', generatedKey, { shouldValidate: false });
    }, [debouncedName, form]);

    const onSubmit = (values: CreateProjectForm) => {
        // If debounce is still pending, generate a fresh key from current name
        // Otherwise use the displayed key (which was generated from debounced name)
        const currentKey = form.getValues('key');

        // Use displayed key if debounce has finished and key matches the debounced name,
        // otherwise generate a fresh key from current name
        const keyToSubmit = !isDebouncing && currentKey ? currentKey : buildSlugWithSuffix(values.name);

        if (!keyToSubmit) {
            form.setError('name', { message: 'Project name must include letters or numbers.' });
            form.setValue('key', keyToSubmit, { shouldValidate: false });
            return;
        }

        createProjectMutation.mutate({
            orgId,
            name: values.name,
            key: keyToSubmit,
            description: values.description,
        });
    };

    const isSaveDisabled = isDebouncing || createProjectMutation.isPending;

    return (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button type="button" className="mt-4 w-full">
                    Start new project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader className="border-none px-0">
                    <div>
                        <DialogTitle>Create project</DialogTitle>
                        <DialogDescription>Create a new project for this organisation.</DialogDescription>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <InputField control={form.control} name="name" label="Project name" required />
                        <InputField
                            control={form.control}
                            name="key"
                            label="Project key"
                            required
                            disabled
                            hideFieldMessage
                        />
                        <TextareaField control={form.control} name="description" label="Description" rows={3} />
                        {createProjectMutation.isError ? (
                            <p className="text-sm text-destructive">
                                {createProjectMutation.error instanceof Error
                                    ? createProjectMutation.error.message
                                    : 'Could not create the project.'}
                            </p>
                        ) : null}
                        <DialogFooter className="flex items-center justify-end gap-2 border-none px-0 pt-0">
                            <Button
                                type="submit"
                                disabled={isSaveDisabled}
                                textLoading="Saving"
                                loadingDots={createProjectMutation.isPending}
                            >
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
