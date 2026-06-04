import type { ModelProfile, ModelProfileKind } from '@aida/contracts';

type EnvSource = Record<string, string | undefined>;

type ProfileDefaults = Pick<ModelProfile, 'mode' | 'supportsFiles' | 'supportsToolUse' | 'maxInputTokens' | 'maxOutputTokens' | 'temperature'>;

const PROFILE_DEFAULTS: Record<ModelProfileKind, ProfileDefaults> = {
    router: {
        mode: 'fast',
        supportsFiles: false,
        supportsToolUse: false,
        maxInputTokens: 16_000,
        maxOutputTokens: 800,
        temperature: 0,
    },
    domainDefault: {
        mode: 'balanced',
        supportsFiles: false,
        supportsToolUse: true,
        maxInputTokens: 64_000,
        maxOutputTokens: 3_000,
        temperature: 0.2,
    },
    summarizer: {
        mode: 'fast',
        supportsFiles: false,
        supportsToolUse: false,
        maxInputTokens: 64_000,
        maxOutputTokens: 1_200,
        temperature: 0,
    },
};

const MODEL_ENV_KEYS: Record<ModelProfileKind, string> = {
    router: 'BEDROCK_MODEL_ROUTER',
    domainDefault: 'BEDROCK_MODEL_DOMAIN_DEFAULT',
    summarizer: 'BEDROCK_MODEL_SUMMARIZER',
};

export function getModelProfile(kind: ModelProfileKind, env: EnvSource = process.env): ModelProfile {
    const region = env.AWS_REGION?.trim();
    const model = env[MODEL_ENV_KEYS[kind]]?.trim();

    if (!region) {
        throw new Error('AWS_REGION is required for Bedrock model profiles.');
    }

    if (!model) {
        throw new Error(`${MODEL_ENV_KEYS[kind]} is required for ${kind} model profile.`);
    }

    return {
        provider: 'bedrock',
        model,
        region,
        ...PROFILE_DEFAULTS[kind],
    };
}
