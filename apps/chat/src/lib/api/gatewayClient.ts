import { createApiClient, type ApiClient } from '@aida/api-client';
import { getChatPublicEnv } from '@aida/config/public';

import { getSupabaseClient } from '@/lib/supabase/supabaseClient';

let gatewayClient: ApiClient | undefined;

/** Shared API gateway client for Chat services (Bearer token from the Supabase session). */
export function getApiGatewayClient(): ApiClient {
    if (!gatewayClient) {
        gatewayClient = createApiClient({
            baseUrl: getChatPublicEnv().NEXT_PUBLIC_API_GATEWAY_URL,
            getAccessToken: async () => {
                const { data } = await getSupabaseClient().auth.getSession();

                return data.session?.access_token;
            },
        });
    }

    return gatewayClient;
}
