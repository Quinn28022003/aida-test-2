import { createApiClient } from '@aida/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getApiGatewayClient } from './gatewayClient';

vi.mock('@aida/api-client', () => ({
    createApiClient: vi.fn(() => ({
        getConfig: () => ({ baseUrl: 'http://localhost:3002' }),
    })),
}));

vi.mock('@aida/config/public', () => ({
    getChatPublicEnv: vi.fn(() => ({
        NEXT_PUBLIC_API_GATEWAY_URL: 'http://localhost:3002',
    })),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
    getSupabaseClient: vi.fn(() => ({
        auth: { getSession: vi.fn() },
    })),
}));

describe('getApiGatewayClient', () => {
    beforeEach(() => {
        vi.mocked(createApiClient).mockClear();
    });

    it('creates an API client that sends bearer auth from the Supabase session', () => {
        getApiGatewayClient();

        const config = vi.mocked(createApiClient).mock.calls[0]?.[0];

        expect(config?.baseUrl).toBe('http://localhost:3002');
        expect(config?.init).toBeUndefined();
        expect(config?.getAccessToken).toBeDefined();
    });
});
