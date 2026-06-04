import type { z } from 'zod';
import { formatZodError } from '../schemas/env';

/**
 * Parse `process.env` with a Zod schema, cache the result, and expose a reset for tests.
 */
export function createCachedProcessEnvGetter<Schema extends z.ZodTypeAny>(
    schema: Schema,
    readEnv: () => Record<string, string | undefined> = () =>
        process.env as Record<string, string | undefined>,
): {
    get: () => z.infer<Schema>;
    reset: () => void;
} {
    let cache: z.infer<Schema> | undefined;

    return {
        get(): z.infer<Schema> {
            if (cache !== undefined) {
                return cache;
            }

            const result = schema.safeParse(readEnv());

            if (!result.success) {
                throw new Error(formatZodError(result.error));
            }

            cache = result.data;
            return result.data;
        },

        reset(): void {
            cache = undefined;
        },
    };
}
