import {
    chatPublicEnvSchema,
    identityPublicEnvSchema,
    vaultPublicEnvSchema,
    type ChatPublicEnv,
    type IdentityPublicEnv,
    type VaultPublicEnv,
} from '../schemas/env';
import { createCachedProcessEnvGetter } from '../utils/cached-process-env';
import { getPublicProcessEnvSnapshot } from '../utils/public-process-env-snapshot';

export {
    chatPublicEnvSchema,
    identityPublicEnvSchema,
    publicEnvBaseSchema,
    publicEnvSchema,
    vaultPublicEnvSchema,
    type ChatPublicEnv,
    type IdentityPublicEnv,
    type PublicEnv,
    type PublicEnvBase,
    type VaultPublicEnv,
} from '../schemas/env';
export { parseCommaSeparatedOrigins } from '../utils/parse-comma-separated-origins';
export { IDENTITY_AUTH_PATHS, isIdentityAuthPath } from '../constants/identityAuthPaths';

const vaultPublicEnv = createCachedProcessEnvGetter(
    vaultPublicEnvSchema,
    getPublicProcessEnvSnapshot,
);
const chatPublicEnv = createCachedProcessEnvGetter(
    chatPublicEnvSchema,
    getPublicProcessEnvSnapshot,
);
const identityPublicEnv = createCachedProcessEnvGetter(
    identityPublicEnvSchema,
    getPublicProcessEnvSnapshot,
);

/**
 * Reset cached public env. Useful for testing.
 * @internal
 */
export function resetPublicEnvCache(): void {
    vaultPublicEnv.reset();
    chatPublicEnv.reset();
    identityPublicEnv.reset();
}

/**
 * Validate public env for `apps/vault` (browser-safe).
 * Results are cached for subsequent calls.
 */
export function getVaultPublicEnv(): VaultPublicEnv {
    return vaultPublicEnv.get();
}

/**
 * Validate public env for `apps/chat` (browser-safe).
 * Results are cached for subsequent calls.
 */
export function getChatPublicEnv(): ChatPublicEnv {
    return chatPublicEnv.get();
}

/**
 * Validate public env for `apps/identity` (browser-safe).
 * Results are cached for subsequent calls.
 */
export function getIdentityPublicEnv(): IdentityPublicEnv {
    return identityPublicEnv.get();
}

/**
 * Same as {@link getVaultPublicEnv} — minimal public schema (vault app).
 * Prefer `getVaultPublicEnv` or `getChatPublicEnv` for app-specific validation.
 */
export function getPublicEnv(): VaultPublicEnv {
    return getVaultPublicEnv();
}
