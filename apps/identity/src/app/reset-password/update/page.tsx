'use client';

import { LoadingSpinner } from '@aida/ui';
import { Button, Form, InputField } from '@aida/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordStrengthMeter } from '@/components/auth/passwordStrengthMeter';
import { AuthPageLayout } from '@/components/authPageLayout';
import { resetPasswordUpdateFormSchema } from '@/lib/auth/schemas';
import { resolveReturnTo } from '@/lib/auth/utils/redirect';
import type { ResetPasswordUpdateFormValues } from '@/lib/auth/types/forms.types';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

export default function ResetPasswordUpdatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();
    const [formError, setFormError] = useState<string | undefined>();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const form = useForm<ResetPasswordUpdateFormValues>({
        resolver: zodResolver(resetPasswordUpdateFormSchema),
        mode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });
    const { isSubmitting } = form.formState;

    const handleResetPasswordUpdateSubmit = async (values: ResetPasswordUpdateFormValues) => {
        setFormError(undefined);

        const { error } = await supabase.auth.updateUser({
            password: values.password,
        });

        if (error) {
            setFormError(error.message);
            return;
        }

        setIsRedirecting(true);
        window.requestAnimationFrame(() => {
            router.replace(resolveReturnTo(searchParams.get('returnTo')));
        });
    };

    return (
        <AuthPageLayout
            title="Choose a new password"
            description="Enter a new password for your account."
        >
            <div className="relative">
                {isRedirecting ? <LoadingSpinner text="Redirecting" /> : null}
                <Form {...form}>
                    <form
                        className="grid gap-5"
                        noValidate
                        onSubmit={form.handleSubmit((values) => handleResetPasswordUpdateSubmit(values))}
                    >
                        {formError ? (
                            <p
                                className="rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive"
                                role="alert"
                            >
                                {formError}
                            </p>
                        ) : null}

                        <div className="space-y-2">
                            <InputField
                                control={form.control}
                                name="password"
                                label="New password"
                                inputType="password"
                                autoComplete="new-password"
                                hideFieldMessage
                            />
                            <PasswordStrengthMeter />
                        </div>

                        <InputField
                            control={form.control}
                            name="confirmPassword"
                            label="Confirm password"
                            inputType="password"
                            autoComplete="new-password"
                        />

                        <Button
                            className="w-full"
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            loadingDots={isSubmitting}
                            textLoading="Updating"
                        >
                            Update password
                        </Button>
                    </form>
                </Form>
            </div>
        </AuthPageLayout>
    );
}
