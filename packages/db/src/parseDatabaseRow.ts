import type { z } from "zod";

function snakeToCamel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Shallow-converts object keys from snake_case to camelCase; values are unchanged. */
function shallowSnakeKeysToCamel(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }

  return result;
}

/**
 * Converts a database row's top-level keys to camelCase and validates with the given schema.
 */
export function parseDatabaseRow<S extends z.ZodType>(
  row: Record<string, unknown>,
  schema: S,
): z.infer<S> {
  return schema.parse(shallowSnakeKeysToCamel(row));
}
