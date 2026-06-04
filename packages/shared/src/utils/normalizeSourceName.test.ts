import { describe, expect, it } from 'vitest';
import { normalizeSourceName } from './normalizeSourceName';

describe('normalizeSourceName', () => {
    it('trims whitespace', () => {
        expect(normalizeSourceName('  hello world  ')).toBe('hello world');
        expect(normalizeSourceName('\t\nhello\t\n')).toBe('hello');
    });

    it('converts to lowercase', () => {
        expect(normalizeSourceName('HELLO WORLD')).toBe('hello world');
        expect(normalizeSourceName('Hello World')).toBe('hello world');
        expect(normalizeSourceName('MiXeD CaSe')).toBe('mixed case');
    });

    it('removes accents', () => {
        expect(normalizeSourceName('café')).toBe('cafe');
        expect(normalizeSourceName('naïve')).toBe('naive');
        expect(normalizeSourceName('résumé')).toBe('resume');
        expect(normalizeSourceName('über')).toBe('uber');
        expect(normalizeSourceName('ñoño')).toBe('nono');
    });

    it('replaces underscores with spaces', () => {
        expect(normalizeSourceName('hello_world')).toBe('hello world');
        expect(normalizeSourceName('snake_case_example')).toBe('snake case example');
        expect(normalizeSourceName('hello___world')).toBe('hello world');
    });

    it('replaces dashes with spaces', () => {
        expect(normalizeSourceName('hello-world')).toBe('hello world');
        expect(normalizeSourceName('kebab-case-example')).toBe('kebab case example');
        expect(normalizeSourceName('hello---world')).toBe('hello world');
    });

    it('collapses whitespace', () => {
        expect(normalizeSourceName('hello   world')).toBe('hello world');
        expect(normalizeSourceName('hello\t\t\tworld')).toBe('hello world');
        expect(normalizeSourceName('hello \n world')).toBe('hello world');
    });

    it('removes file copy suffixes like (1)', () => {
        expect(normalizeSourceName('document (1).pdf')).toBe('document.pdf');
        expect(normalizeSourceName('file (2).txt')).toBe('file.txt');
        expect(normalizeSourceName('image (99).png')).toBe('image.png');
    });

    it('removes timestamp/hash suffixes before extensions', () => {
        expect(normalizeSourceName('document 1234567890.pdf')).toBe('document.pdf');
        expect(normalizeSourceName('file_1234567890123.txt')).toBe('file.txt');
        expect(normalizeSourceName('image-1234567890.png')).toBe('image.png');
    });

    it('handles empty strings', () => {
        expect(normalizeSourceName('')).toBe('');
    });

    it('handles strings that normalize to empty', () => {
        expect(normalizeSourceName('   ')).toBe('');
        expect(normalizeSourceName('___')).toBe('');
        expect(normalizeSourceName('---')).toBe('');
    });

    it('combines all transformations', () => {
        expect(normalizeSourceName('  My_Project-Name (1).PDF  ')).toBe('my project name.pdf');
        expect(normalizeSourceName('CAFÉ_Résumé-1234567890.DOCX')).toBe('cafe resume.docx');
    });
});
