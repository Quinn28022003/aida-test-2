import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    function advance(ms: number) {
        act(() => {
            vi.advanceTimersByTime(ms);
        });
    }

    it('returns immediate initial value', () => {
        const { result } = renderHook(() => useDebouncedValue('initial'));

        expect(result.current.debouncedValue).toBe('initial');
        expect(result.current.isDebouncing).toBe(false);
    });

    it('uses default 500ms delay', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
            initialProps: { value: 'first' },
        });

        expect(result.current.isDebouncing).toBe(false);

        rerender({ value: 'second' });
        expect(result.current.debouncedValue).toBe('first');
        expect(result.current.isDebouncing).toBe(true);

        advance(499);
        expect(result.current.debouncedValue).toBe('first');
        expect(result.current.isDebouncing).toBe(true);

        advance(1);
        expect(result.current.debouncedValue).toBe('second');
        expect(result.current.isDebouncing).toBe(false);
    });

    it('respects custom delay override', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
            initialProps: { value: 'first' },
        });

        expect(result.current.isDebouncing).toBe(false);

        rerender({ value: 'second' });
        expect(result.current.debouncedValue).toBe('first');
        expect(result.current.isDebouncing).toBe(true);

        advance(199);
        expect(result.current.debouncedValue).toBe('first');
        expect(result.current.isDebouncing).toBe(true);

        advance(1);
        expect(result.current.debouncedValue).toBe('second');
        expect(result.current.isDebouncing).toBe(false);
    });

    it('marks isDebouncing true while waiting', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
            initialProps: { value: 'first' },
        });

        rerender({ value: 'second' });
        expect(result.current.isDebouncing).toBe(true);
    });

    it('marks isDebouncing false after timer flush', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
            initialProps: { value: 'first' },
        });

        expect(result.current.isDebouncing).toBe(false);

        rerender({ value: 'second' });

        advance(500);
        expect(result.current.isDebouncing).toBe(false);
        expect(result.current.debouncedValue).toBe('second');
    });

    it('cancels pending timer when value changes rapidly', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
            initialProps: { value: 'first' },
        });

        expect(result.current.isDebouncing).toBe(false);

        rerender({ value: 'second' });
        expect(result.current.isDebouncing).toBe(true);

        rerender({ value: 'third' });

        expect(result.current.debouncedValue).toBe('first');
        expect(result.current.isDebouncing).toBe(true);

        advance(500);
        expect(result.current.debouncedValue).toBe('third');
        expect(result.current.isDebouncing).toBe(false);
    });
});
