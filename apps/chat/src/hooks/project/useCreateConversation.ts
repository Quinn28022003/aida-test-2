'use client';

import { useMutation } from '@tanstack/react-query';

import {
    type CreateConversationInput,
    type CreateConversationResult,
    ProjectService,
} from '@/services/project.service';

type UseCreateConversationOptions = {
    onSuccess?: (result: CreateConversationResult, variables: CreateConversationInput) => void;
};

export function useCreateConversation(options?: UseCreateConversationOptions) {
    return useMutation({
        mutationFn: (values: CreateConversationInput) => ProjectService.createConversation(values),
        onSuccess: (result, variables) => {
            options?.onSuccess?.(result, variables);
        },
    });
}
