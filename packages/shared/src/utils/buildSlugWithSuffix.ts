import { normalizeSourceName } from './normalizeSourceName';

/** Generates a lower-case alpha-numeric suffix for reducing slug collisions. */
function generateRandomSuffix(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
    } else {
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    return result;
}

/** Converts a normalised source name into a lower-case hyphenated slug. */
function toSlug(value: string): string {
    return value
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Builds a stable-looking slug from a source name and appends a random suffix.
 *
 * Returns an empty string when the source name cannot produce any slug characters.
 */
export function buildSlugWithSuffix(value: string, suffixLength = 11): string {
    const normalized = normalizeSourceName(value);
    const slug = toSlug(normalized);

    if (!slug) {
        return '';
    }

    const suffix = generateRandomSuffix(suffixLength);
    return `${slug}-${suffix}`;
}
