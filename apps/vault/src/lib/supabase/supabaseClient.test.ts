import { createBrowserClient } from '@supabase/ssr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseClient } from './supabaseClient';

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => ({
        supabaseUrl: 'https://example.supabase.co',
        supabaseKey: 'anon-key',
        auth: {
            onAuthStateChange: vi.fn(),
        },
    })),
}));

describe('createSupabaseClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses createBrowserClient with the public Supabase URL and anon key', () => {
        createSupabaseClient({
            supabaseUrl: 'https://example.supabase.co',
            supabaseAnonKey: 'anon-key',
        });

        expect(createBrowserClient).toHaveBeenCalledWith(
            'https://example.supabase.co',
            'anon-key',
        );
        expect(createBrowserClient).toHaveBeenCalledTimes(1);
    });

    it('returns a client with auth helpers for session listeners', () => {
        const client = createSupabaseClient({
            supabaseUrl: 'https://example.supabase.co',
            supabaseAnonKey: 'anon-key',
        });

        expect(client).toBeDefined();
        expect(client.auth.onAuthStateChange).toBeTypeOf('function');
    });
});
