import { describe, expect, it } from 'vitest';
import { getModelProfile } from './profiles';

describe('model profiles', () => {
    it('resolves router, domain, and summarizer profiles from env', () => {
        const env = {
            AWS_REGION: 'ap-southeast-2',
            BEDROCK_MODEL_ROUTER: 'router-model',
            BEDROCK_MODEL_DOMAIN_DEFAULT: 'domain-model',
            BEDROCK_MODEL_SUMMARIZER: 'summarizer-model',
        };

        expect(getModelProfile('router', env)).toMatchObject({
            provider: 'bedrock',
            model: 'router-model',
            mode: 'fast',
            maxOutputTokens: 800,
            temperature: 0,
        });
        expect(getModelProfile('domainDefault', env)).toMatchObject({
            model: 'domain-model',
            mode: 'balanced',
            supportsToolUse: true,
        });
        expect(getModelProfile('summarizer', env)).toMatchObject({
            model: 'summarizer-model',
            mode: 'fast',
            maxOutputTokens: 1_200,
        });
    });

    it('requires matching env vars', () => {
        expect(() => getModelProfile('router', { AWS_REGION: 'ap-southeast-2' })).toThrow('BEDROCK_MODEL_ROUTER');
    });
});
