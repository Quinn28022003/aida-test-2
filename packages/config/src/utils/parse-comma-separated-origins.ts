/** Parses comma-separated browser origins (e.g. return-to allowlist, CORS). */
export function parseCommaSeparatedOrigins(raw: string): string[] {
    return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}
