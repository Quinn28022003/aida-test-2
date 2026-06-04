/**
 * Normalises a user or file-provided source name for comparison and key generation.
 *
 * The result is lower-case, accent-free, whitespace-collapsed text with common
 * duplicate file suffixes removed.
 */
export const normalizeSourceName = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*\((\d+)\)(\.[a-z0-9]+)$/i, '$2')
        .replace(/[\s_-]\d{10,}(\.[a-z0-9]+)$/i, '$1')
        .trim();
};
