import { useEffect, useRef, useState } from 'react';

/**
 * Returns a debounced copy of a value and whether a pending update is waiting.
 *
 * The initial value is available immediately; later changes update after
 * `delayMs` milliseconds without another change.
 */
export function useDebouncedValue<T>(value: T, delayMs = 500) {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const [isDebouncing, setIsDebouncing] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRenderRef = useRef(true);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            setIsDebouncing(false);
            return;
        }

        setIsDebouncing(true);

        timerRef.current = setTimeout(() => {
            setDebouncedValue(value);
            setIsDebouncing(false);
        }, delayMs);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delayMs]);

    return { debouncedValue, isDebouncing };
}
