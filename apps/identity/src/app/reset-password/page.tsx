'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { Button, Form, InputField } from '@aida/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthPageLayout } from '@/components/authPageLayout';
import { resetPasswordRequestFormSchema } from '@/lib/auth/schemas';
import { preserveReturnToQuery } from '@/lib/auth/utils/redirect';
import type { ResetPasswordRequestFormValues } from '@/lib/auth/types/forms.types';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

const RESET_PASSWORD_SUCCESS_MESSAGE =
    'If an account exists for that email, a reset link has been sent.';

export default function ResetPasswordRequestPage() {
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();
    const [formError, setFormError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState<string | undefined>();

    const returnTo = searchParams.get('returnTo');
    const returnToQuery = preserveReturnToQuery(returnTo);
    const form = useForm<ResetPasswordRequestFormValues>({
        resolver: zodResolver(resetPasswordRequestFormSchema),
        defaultValues: {
            email: '',
        },
    });
    const { isSubmitting } = form.formState;

    const handleResetPasswordRequestSubmit = async (values: ResetPasswordRequestFormValues) => {
        setFormError(undefined);
        setSuccessMessage(undefined);

        const redirectTo = `${window.location.origin}${IDENTITY_AUTH_PATHS.resetPasswordUpdate}${returnToQuery}`;
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo,
        });

        if (error) {
            setFormError(error.message);
            return;
        }

        setSuccessMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
    };

    return (
        <AuthPageLayout
            title="Reset password"
            description="Enter your email and we will send you a link to choose a new password."
        >
            <Form {...form}>
                <form
                    className="grid gap-5"
                    noValidate
                    onSubmit={form.handleSubmit((values) => handleResetPasswordRequestSubmit(values))}
                >
                    {formError ? (
                        <p
                            className="rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive"
                            role="alert"
                        >
                            {formError}
                        </p>
                    ) : null}
                    {successMessage ? (
                        <p className="rounded-lg bg-accent px-3 py-3 text-sm text-success">
                            {successMessage}
                        </p>
                    ) : null}

                    <InputField
                        control={form.control}
                        name="email"
                        label="Email"
                        inputType="email"
                        autoComplete="email"
                    />

                    <Button
                        className="w-full"
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        loadingDots={isSubmitting}
                        textLoading="Sending"
                    >
                        Send reset link
                    </Button>

                    <p className="text-center text-sm">
                        <Link
                            className="font-medium text-primary hover:underline"
                            href={`${IDENTITY_AUTH_PATHS.login}${returnToQuery}`}
                        >
                            Back to sign in
                        </Link>
                    </p>
                </form>
            </Form>
        </AuthPageLayout>
    );
}
