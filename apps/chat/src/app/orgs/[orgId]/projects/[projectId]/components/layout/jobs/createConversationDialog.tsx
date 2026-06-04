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
} from '@aida/ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateConversation } from '@/hooks/project';

const createConversationFormSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
});

type CreateConversationForm = z.infer<typeof createConversationFormSchema>;

type CreateConversationDialogProps = {
    orgId: string;
    projectId: string;
    jobId: string;
    defaultTitle?: string;
    trigger: React.ReactNode;
};

export function CreateConversationDialog({
    orgId,
    projectId,
    jobId,
    defaultTitle,
    trigger,
}: CreateConversationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<CreateConversationForm>({
        resolver: zodResolver(createConversationFormSchema),
        defaultValues: { title: defaultTitle ?? '' },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({ title: defaultTitle ?? '' });
        }
    }, [defaultTitle, form, isOpen]);

    const createConversationMutation = useCreateConversation({
        onSuccess: () => {
            setIsOpen(false);
            form.reset();
        },
    });

    const onSubmit = (values: CreateConversationForm) => {
        createConversationMutation.mutate({
            orgId,
            projectId,
            jobId,
            title: values.title,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader className="border-none px-0">
                    <div>
                        <DialogTitle>Start conversation</DialogTitle>
                        <DialogDescription>Create a new conversation for this job ticket.</DialogDescription>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <InputField control={form.control} name="title" label="Title" required />
                        {createConversationMutation.isError && (
                            <p className="text-sm text-destructive">
                                {createConversationMutation.error instanceof Error
                                    ? createConversationMutation.error.message
                                    : 'Could not create the conversation.'}
                            </p>
                        )}
                        <DialogFooter className="flex items-center justify-end gap-2 border-none px-0 pt-0">
                            <Button
                                type="submit"
                                disabled={createConversationMutation.isPending}
                                textLoading="Creating"
                                loadingDots={createConversationMutation.isPending}
                            >
                                Start conversation
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
