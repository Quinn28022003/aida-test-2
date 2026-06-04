import { describe, expect, it } from 'vitest';

import { parseCorsAllowedOrigins } from './cors';

describe('parseCorsAllowedOrigins', () => {
    it('splits comma-separated origins and trims whitespace', () => {
        expect(
            parseCorsAllowedOrigins(
                'http://localhost:3000, https://vault.example.com ,http://127.0.0.1:3000',
            ),
        ).toEqual([
            'http://localhost:3000',
            'https://vault.example.com',
            'http://127.0.0.1:3000',
        ]);
    });

    it('drops empty segments from trailing or duplicate commas', () => {
        expect(parseCorsAllowedOrigins('http://a.test,,http://b.test,')).toEqual([
            'http://a.test',
            'http://b.test',
        ]);
    });

    it('returns an empty array for blank input', () => {
        expect(parseCorsAllowedOrigins('')).toEqual([]);
        expect(parseCorsAllowedOrigins('   ,  , ')).toEqual([]);
    });
});
