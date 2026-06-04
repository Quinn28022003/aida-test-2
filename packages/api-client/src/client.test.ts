import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAuthSession } from './generated';
import { createApiClient } from './client';

function createSuccessFetchMock() {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        }),
    );

    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
}

function getFetchHeaders(fetchMock: ReturnType<typeof createSuccessFetchMock>) {
    const request = fetchMock.mock.calls[0]?.[0] as Request;

    return new Headers(request.headers);
}

describe('createApiClient', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('creates a generated fetch client', () => {
        const client = createApiClient({ baseUrl: 'http://localhost:3002' });

        expect(client).toBeDefined();
        expect(client.getConfig().baseUrl).toBe('http://localhost:3002');
    });

    it('does not set Authorization by default', async () => {
        const fetchMock = createSuccessFetchMock();
        const client = createApiClient({ baseUrl: 'http://localhost:3002' });

        await getAuthSession({ client });

        expect(getFetchHeaders(fetchMock).get('Authorization')).toBeNull();
    });

    it('passes default init such as credentials include to fetch', async () => {
        const fetchMock = createSuccessFetchMock();

        const client = createApiClient({
            baseUrl: 'http://localhost:3002',
            init: { credentials: 'include' },
        });

        await getAuthSession({ client });

        const request = fetchMock.mock.calls[0]?.[0] as Request;

        expect(request.credentials).toBe('include');
    });

    it('keeps per-request headers when merging defaults', async () => {
        const fetchMock = createSuccessFetchMock();

        const client = createApiClient({
            baseUrl: 'http://localhost:3002',
            init: {
                credentials: 'include',
                headers: { 'X-Default-Trace': 'default-1' },
            },
        });

        await getAuthSession({
            client,
            headers: { 'X-Request-Trace': 'trace-1' },
        });

        const request = fetchMock.mock.calls[0]?.[0] as Request;
        const headers = new Headers(request.headers);

        expect(request.credentials).toBe('include');
        expect(headers.get('X-Default-Trace')).toBe('default-1');
        expect(headers.get('X-Request-Trace')).toBe('trace-1');
        expect(headers.get('Authorization')).toBeNull();
    });

    it('preserves manual Authorization headers from callers', async () => {
        const fetchMock = createSuccessFetchMock();
        const client = createApiClient({ baseUrl: 'http://localhost:3002' });

        await getAuthSession({
            client,
            headers: { Authorization: 'Bearer manual-token' },
        });

        expect(getFetchHeaders(fetchMock).get('Authorization')).toBe('Bearer manual-token');
    });

    it('sets Authorization from getAccessToken when the caller did not provide one', async () => {
        const fetchMock = createSuccessFetchMock();
        const client = createApiClient({
            baseUrl: 'http://localhost:3002',
            getAccessToken: async () => 'session-token',
        });

        await getAuthSession({ client });

        expect(getFetchHeaders(fetchMock).get('Authorization')).toBe('Bearer session-token');
    });

    it('does not override an explicit Authorization header with getAccessToken', async () => {
        const fetchMock = createSuccessFetchMock();
        const getAccessToken = vi.fn().mockResolvedValue('session-token');
        const client = createApiClient({
            baseUrl: 'http://localhost:3002',
            getAccessToken,
        });

        await getAuthSession({
            client,
            headers: { Authorization: 'Bearer manual-token' },
        });

        expect(getAccessToken).not.toHaveBeenCalled();
        expect(getFetchHeaders(fetchMock).get('Authorization')).toBe('Bearer manual-token');
    });
});
