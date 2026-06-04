'use client';

import type { ConversationsRow, JobsRow } from '@aida/db';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, AvatarFallback, Button, Input, MoreVerticalIcon, PaperclipIcon, SendIcon, cn } from '@aida/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
    PanelBody,
    PanelFooter,
    PanelHeader,
    PanelShell,
} from '../panelLayout';

const composerSchema = z.object({
    prompt: z.string().min(1, 'Please enter a message.').max(4000, 'Message is too long.'),
});

type ComposerForm = z.infer<typeof composerSchema>;

type ChatPanelProps = {
    selectedJob: JobsRow | undefined;
    selectedConversation: ConversationsRow | undefined;
};

export function ChatPanel({ selectedJob, selectedConversation }: ChatPanelProps) {
    const form = useForm<ComposerForm>({
        resolver: zodResolver(composerSchema),
        defaultValues: { prompt: '' },
    });

    const handleCompose = () => {
        form.reset();
    };

    const conversationTitle = selectedConversation?.title ?? 'Conversation';
    const emptyStateMessage = selectedJob
        ? "Send me a message and I'll help with whatever you need."
        : 'Choose a conversation from the job panel.';

    return (
        <PanelShell>
            <PanelHeader className="justify-between gap-3">
                <h3 className="m-0 min-w-0 flex-1 truncate text-base font-semibold text-foreground">
                    {conversationTitle}
                </h3>
                <button
                    type="button"
                    className="shrink-0 text-muted-foreground transition hover:text-foreground"
                    aria-label="Conversation options"
                >
                    <MoreVerticalIcon className="size-6" />
                </button>
            </PanelHeader>

            <PanelBody className="px-5 py-6">
                {!selectedConversation ? (
                    <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                        <p className="m-0 text-sm text-muted-foreground">{emptyStateMessage}</p>
                    </div>
                ) : (
                    <div className="flex min-w-0 gap-3">
                        <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                D
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
                                <p className="m-0">
                                    Conversation shell is active. Message streaming and send actions will be wired once
                                    gateway conversation APIs are implemented.
                                </p>
                            </div>
                            <p className="m-0 mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Dimitri • 4:42 PM
                            </p>
                        </div>
                    </div>
                )}
            </PanelBody>

            <PanelFooter>
                <form onSubmit={form.handleSubmit(handleCompose)} className="flex w-full min-w-0 items-center gap-2">
                    <button
                        type="button"
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                        aria-label="Attach file"
                        disabled={!selectedConversation}
                    >
                        <PaperclipIcon />
                    </button>
                    <div className="min-w-0 flex-1">
                        <Input
                            placeholder="Type a message to the team..."
                            className={cn('min-w-0', form.formState.errors.prompt && 'border-destructive')}
                            disabled={!selectedConversation}
                            {...form.register('prompt')}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="size-10 shrink-0 rounded-full px-0"
                        aria-label="Send message"
                        disabled={!selectedConversation}
                    >
                        <SendIcon />
                    </Button>
                </form>
            </PanelFooter>
        </PanelShell>
    );
}
