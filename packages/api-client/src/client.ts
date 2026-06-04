import { createClient } from './generated/client';
import type { Client } from './generated/client';

/** Options used to create a typed fetch client for the API gateway. */
export type CreateApiClientOptions = {
    /** Base API gateway origin or URL prefix. */
    baseUrl: string;
    /** Default fetch init merged into every request (e.g. `credentials: 'include'`). */
    init?: RequestInit;
    /**
     * Resolves the Supabase access token for gateway auth when the caller did not set Authorization.
     * Typically wired to `supabase.auth.getSession()` so `@supabase/ssr` reads the session cookie.
     */
    getAccessToken?: () => Promise<string | null | undefined>;
};

/** Merges default and per-request headers while preserving the latest value for each key. */
function mergeHeaders(...sources: (HeadersInit | undefined)[]): Headers {
    const headers = new Headers();

    for (const source of sources) {
        if (source === undefined) {
            continue;
        }

        new Headers(source).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    return headers;
}

/** Creates a typed API gateway client backed by the generated OpenAPI fetch SDK. */
export function createApiClient(options: CreateApiClientOptions): Client {
    const { baseUrl, init: defaultInit, getAccessToken } = options;

    return createClient({
        baseUrl,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const headers = mergeHeaders(defaultInit?.headers, init?.headers, request.headers);

            if (!headers.has('Authorization') && getAccessToken) {
                const token = await getAccessToken();
                if (token) {
                    headers.set('Authorization', `Bearer ${token}`);
                }
            }

            return fetch(
                new Request(request, {
                    ...defaultInit,
                    ...init,
                    headers,
                }),
            );
        },
    });
}

/** Typed API gateway client returned by {@link createApiClient}. */
export type ApiClient = ReturnType<typeof createApiClient>;
