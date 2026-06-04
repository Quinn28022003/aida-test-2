import { z } from 'zod';
import { AIDA_DEBUG_TRACE_DEFAULT, DEBUG_DEFAULT, LOG_LEVEL_DEFAULT, LOG_LEVELS } from '../constants/env';

export function booleanTransform(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export const booleanSchema = z.string().default(DEBUG_DEFAULT).transform(booleanTransform);

/** Public vars shared by `apps/chat` and `apps/vault` (.env.example). */
export const publicEnvBaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
});

/** `apps/vault` — matches vault/.env.example. */
export const vaultPublicEnvSchema = publicEnvBaseSchema.extend({
    NEXT_PUBLIC_API_GATEWAY_URL: z.string().url(),
    NEXT_PUBLIC_IDENTITY_DOMAIN: z.string().min(1),
});

/** `apps/chat` — matches chat/.env.example (link to vault origin). */
export const chatPublicEnvSchema = publicEnvBaseSchema.extend({
    NEXT_PUBLIC_VAULT_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_API_GATEWAY_URL: z.string().url(),
    NEXT_PUBLIC_IDENTITY_DOMAIN: z.string().min(1),
});

/** `apps/identity` — shared auth frontend. */
export const identityPublicEnvSchema = publicEnvBaseSchema.extend({
    NEXT_PUBLIC_CHAT_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_ALLOWED_RETURN_TO_ORIGINS: z.string().min(1),
});

/**
 * Alias for `vaultPublicEnvSchema` (minimal public surface).
 * Prefer `vaultPublicEnvSchema` / `chatPublicEnvSchema` for clarity.
 */
export const publicEnvSchema = vaultPublicEnvSchema;

/** Core backend vars used by both api-gateway and background-service. */
export const coreBackendEnvSchema = z.object({
    SUPABASE_URL: z.string().url(),
    /** Service role key for server-side Supabase clients (Settings → API). */
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    LOG_LEVEL: z.enum(LOG_LEVELS).default(LOG_LEVEL_DEFAULT),
    DEBUG: z.string().default(DEBUG_DEFAULT).transform(booleanTransform),
    AIDA_DEBUG_TRACE: z
        .string()
        .default(AIDA_DEBUG_TRACE_DEFAULT)
        .transform(booleanTransform),
});

/**
 * `apps/api-gateway` — matches api-gateway/.env.example.
 * User JWTs are verified with `withSupabase` + JWKS fetched from `SUPABASE_URL` at startup.
 * `SUPABASE_JWT_SECRET` is not supported.
 */
export const serverEnvSchema = coreBackendEnvSchema.extend({
    /** Publishable key — must match chat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for user-scoped routes. */
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    PORT: z.coerce.number().int().positive(),
    /** Public API origin (scheme + host + port) for Swagger — align with chat/vault `NEXT_PUBLIC_API_GATEWAY_URL`. */
    API_GATEWAY_DOMAIN: z.string().url().optional(),
    /** Comma-separated browser origins (e.g. Chat, Vault) for CORS. */
    CORS_ALLOWED_ORIGINS: z.string().min(1),
    APP_ENCRYPTION_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    SUPPORT_EMAIL_FROM: z.string().min(1),
    BEDROCK_MODEL_ROUTER: z.string().min(1),
    BEDROCK_MODEL_DOMAIN_DEFAULT: z.string().min(1),
    BEDROCK_MODEL_SUMMARIZER: z.string().min(1),
});

/** `apps/background-service` — matches background-service/.env.example. */
export const workerEnvSchema = coreBackendEnvSchema.extend({
  PORT: z.coerce.number().int().positive(),
  BEDROCK_MODEL_SUMMARIZER: z.string().min(1),
  BEDROCK_MODEL_EMBEDDING: z.string().min(1),
});

export type PublicEnvKey = keyof z.infer<typeof vaultPublicEnvSchema>;
export type ChatPublicEnvKey = keyof z.infer<typeof chatPublicEnvSchema>;
export type IdentityPublicEnvKey = keyof z.infer<typeof identityPublicEnvSchema>;
export type ServerEnvKey = keyof z.infer<typeof serverEnvSchema>;
export type WorkerEnvKey = keyof z.infer<typeof workerEnvSchema>;

export type PublicEnvBase = z.infer<typeof publicEnvBaseSchema>;
export type VaultPublicEnv = z.infer<typeof vaultPublicEnvSchema>;
export type ChatPublicEnv = z.infer<typeof chatPublicEnvSchema>;
export type IdentityPublicEnv = z.infer<typeof identityPublicEnvSchema>;
/** @deprecated Prefer `VaultPublicEnv`. */
export type PublicEnv = VaultPublicEnv;

export type CoreBackendEnv = z.infer<typeof coreBackendEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function formatZodError(error: z.ZodError): string {
  return `Invalid environment variables:\n\n${z.prettifyError(error)}`;
}
