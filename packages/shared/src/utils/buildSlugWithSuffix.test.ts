import { describe, expect, it } from 'vitest';
import { buildSlugWithSuffix } from './buildSlugWithSuffix';

describe('buildSlugWithSuffix', () => {
    it('generates slug with random suffix', () => {
        const key = buildSlugWithSuffix('Kitchen');
        expect(key).toMatch(/^kitchen-[a-z0-9]{11}$/);
    });

    it('handles Vietnamese name with accents', () => {
        const key = buildSlugWithSuffix('Hà Hoàng Quân');
        expect(key).toMatch(/^ha-hoang-quan-[a-z0-9]{11}$/);
    });

    it('removes accents before slugging', () => {
        const key = buildSlugWithSuffix('Café Résumé');
        expect(key).toMatch(/^cafe-resume-[a-z0-9]{11}$/);
    });

    it('collapses spaces to single hyphens', () => {
        const key = buildSlugWithSuffix('hello   world');
        expect(key).toMatch(/^hello-world-[a-z0-9]{11}$/);
    });

    it('collapses underscores to single hyphens', () => {
        const key = buildSlugWithSuffix('hello_world');
        expect(key).toMatch(/^hello-world-[a-z0-9]{11}$/);
    });

    it('collapses multiple dashes to single hyphens', () => {
        const key = buildSlugWithSuffix('hello---world');
        expect(key).toMatch(/^hello-world-[a-z0-9]{11}$/);
    });

    it('removes leading hyphens', () => {
        const key = buildSlugWithSuffix('---hello');
        expect(key).toMatch(/^hello-[a-z0-9]{11}$/);
    });

    it('removes trailing hyphens', () => {
        const key = buildSlugWithSuffix('hello---');
        expect(key).toMatch(/^hello-[a-z0-9]{11}$/);
    });

    it('returns empty string for empty input', () => {
        expect(buildSlugWithSuffix('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(buildSlugWithSuffix('   ')).toBe('');
    });

    it('returns empty string for symbol-only input', () => {
        expect(buildSlugWithSuffix('___')).toBe('');
        expect(buildSlugWithSuffix('---')).toBe('');
        expect(buildSlugWithSuffix('!@#$%')).toBe('');
    });

    it('suffix matches [a-z0-9]{11} pattern', () => {
        const key = buildSlugWithSuffix('Test Project');
        const suffix = key.split('-').pop();
        expect(suffix).toMatch(/^[a-z0-9]{11}$/);
    });

    it('generates different suffixes for same input', () => {
        const key1 = buildSlugWithSuffix('Project');
        const key2 = buildSlugWithSuffix('Project');
        expect(key1).not.toBe(key2);
    });

    it('uses custom suffix length when provided', () => {
        const key = buildSlugWithSuffix('Project', 5);
        expect(key).toMatch(/^project-[a-z0-9]{5}$/);
    });

    it('handles mixed separators', () => {
        const key = buildSlugWithSuffix('hello_world-test');
        expect(key).toMatch(/^hello-world-test-[a-z0-9]{11}$/);
    });

    it('converts to lowercase', () => {
        const key = buildSlugWithSuffix('HELLO WORLD');
        expect(key).toMatch(/^hello-world-[a-z0-9]{11}$/);
    });

    it('trims whitespace before processing', () => {
        const key = buildSlugWithSuffix('  hello world  ');
        expect(key).toMatch(/^hello-world-[a-z0-9]{11}$/);
    });

    it('generates valid key when crypto is available', () => {
        // This test verifies the normal path works when crypto is available
        const key = buildSlugWithSuffix('Crypto Available Test');
        expect(key).toMatch(/^crypto-available-test-[a-z0-9]{11}$/);
    });
});
