/**
 * Read each `NEXT_PUBLIC_*` key explicitly so Next.js can inline values in client bundles.
 * Passing the whole `process.env` object to Zod fails in the browser (values stay undefined).
 */
export function getPublicProcessEnvSnapshot(): Record<string, string | undefined> {
    return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        NEXT_PUBLIC_VAULT_DOMAIN: process.env.NEXT_PUBLIC_VAULT_DOMAIN,
        NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
        NEXT_PUBLIC_IDENTITY_DOMAIN: process.env.NEXT_PUBLIC_IDENTITY_DOMAIN,
        NEXT_PUBLIC_CHAT_DOMAIN: process.env.NEXT_PUBLIC_CHAT_DOMAIN,
        NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS: process.env.NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS,
    };
}
