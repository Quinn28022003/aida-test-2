'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { Button, Form, InputField } from '@aida/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { PasswordStrengthMeter } from '@/components/auth/passwordStrengthMeter';
import { AuthPageLayout } from '@/components/authPageLayout';
import { registerFormSchema } from '@/lib/auth/schemas';
import { preserveReturnToQuery } from '@/lib/auth/utils/redirect';
import type { RegisterFormValues } from '@/lib/auth/types/forms.types';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();
    const [formError, setFormError] = useState<string | undefined>();
    const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

    const returnTo = searchParams.get('returnTo');
    const returnToQuery = preserveReturnToQuery(returnTo);
    const loginHref = `${IDENTITY_AUTH_PATHS.login}${returnToQuery}`;
    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        mode: 'onChange',
        criteriaMode: 'all',
        defaultValues: {
            displayName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });
    const { isSubmitting } = form.formState;

    const handleUseDifferentEmail = () => {
        setConfirmedEmail(null);
        setFormError(undefined);
    };

    const handleRegisterSubmit = async (values: RegisterFormValues) => {
        setFormError(undefined);
        setConfirmedEmail(null);

        const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: {
                    display_name: values.displayName,
                },
            },
        });

        if (error) {
            setFormError(error.message);
            return;
        }

        setConfirmedEmail(values.email);
    };

    if (confirmedEmail) {
        return (
            <AuthPageLayout
                title="Check your email"
                description={`We've sent a confirmation link to ${confirmedEmail}. Open it to confirm your account, then sign in.`}
            >
                <div className="grid gap-3">
                    <Button className="w-full" href={loginHref} size="lg">
                        Back to sign in
                    </Button>
                    <Button
                        className="w-full"
                        size="lg"
                        variant="outline"
                        onClick={handleUseDifferentEmail}
                    >
                        Use a different email
                    </Button>
                </div>
            </AuthPageLayout>
        );
    }

    return (
        <AuthPageLayout
            title="Create account"
            description="Register with your work email to access Aida."
        >
            <Form {...form}>
                <form
                    className="grid gap-5"
                    noValidate
                    onSubmit={form.handleSubmit((values) => handleRegisterSubmit(values))}
                >
                    {formError ? (
                        <p
                            className="rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive"
                            role="alert"
                        >
                            {formError}
                        </p>
                    ) : null}

                    <InputField
                        control={form.control}
                        name="displayName"
                        label="Display name"
                        autoComplete="name"
                    />

                    <InputField
                        control={form.control}
                        name="email"
                        label="Email"
                        inputType="email"
                        autoComplete="email"
                    />

                    <div className="space-y-2">
                        <InputField
                            control={form.control}
                            name="password"
                            label="Password"
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
                        textLoading="Creating account"
                    >
                        Create account
                    </Button>

                    <p className="text-center text-sm">
                        <Link className="font-medium text-primary hover:underline" href={loginHref}>
                            Already have an account? Sign in
                        </Link>
                    </p>
                </form>
            </Form>
        </AuthPageLayout>
    );
}
