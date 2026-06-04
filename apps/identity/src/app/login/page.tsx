'use client';

import { IDENTITY_AUTH_PATHS } from '@aida/config/public';
import { Button, Form, InputField } from '@aida/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthPageLayout } from '@/components/authPageLayout';
import { loginFormSchema } from '@/lib/auth/schemas';
import type { LoginFormValues } from '@/lib/auth/types/forms.types';
import { getLoginErrorMessage } from '@/lib/auth/utils/loginErrorMessage';
import { preserveReturnToQuery } from '@/lib/auth/utils/redirect';
import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const supabase = getSupabaseClient();
    const [formError, setFormError] = useState<string | undefined>();

    const returnTo = searchParams.get('returnTo');
    const returnToQuery = preserveReturnToQuery(returnTo);
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const { isSubmitting } = form.formState;

    const handleLoginSubmit = async (values: LoginFormValues) => {
        setFormError(undefined);

        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });

        if (error) {
            setFormError(getLoginErrorMessage(error.message));
        }
    };

    return (
        <AuthPageLayout
            title="Welcome back"
            description="Sign in to your account to continue"
        >
            <Form {...form}>
                <form
                    className="grid gap-5"
                    noValidate
                    onSubmit={form.handleSubmit((values) => handleLoginSubmit(values))}
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
                        name="email"
                        label="Email"
                        inputType="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                    />

                    <InputField
                        control={form.control}
                        name="password"
                        label="Password"
                        inputType="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                    />

                    <div className="-mt-3 flex justify-end">
                        <Link
                            className="text-sm font-medium text-primary hover:underline"
                            href={`${IDENTITY_AUTH_PATHS.resetPasswordRequest}${returnToQuery}`}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        className="w-full"
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        loadingDots={isSubmitting}
                        textLoading="Signing in"
                    >
                        Sign in
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            className="font-semibold text-primary hover:underline"
                            href={`${IDENTITY_AUTH_PATHS.register}${returnToQuery}`}
                        >
                            Sign up
                        </Link>
                    </p>
                </form>
            </Form>
        </AuthPageLayout>
    );
}
