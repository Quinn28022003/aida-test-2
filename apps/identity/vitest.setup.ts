import '@testing-library/jest-dom/vitest';

function createLocalStorageMock(): Storage {
    let store: Record<string, string> = {};

    return {
        get length() {
            return Object.keys(store).length;
        },
        clear() {
            store = {};
        },
        getItem(key: string) {
            return store[key] ?? null;
        },
        key(index: number) {
            return Object.keys(store)[index] ?? null;
        },
        removeItem(key: string) {
            delete store[key];
        },
        setItem(key: string, value: string) {
            store[key] = String(value);
        },
    };
}

Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
});
