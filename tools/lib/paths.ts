import path from 'node:path';

/** Repo root; root `package.json` scripts always run with cwd at the monorepo root. */
export const repoRoot = process.cwd();

/** Committed Supabase-generated types consumed by `@aida/db`. */
export const dbTypesPath = path.join(
  repoRoot,
  'packages/db/src/database-generated.types.ts',
);

/**
 * Written first, then renamed over `dbTypesPath` so a failed `supabase gen types`
 * does not truncate the committed file mid-run.
 */
export const dbTypesTempPath = `${dbTypesPath}.tmp`;

/** Committed Zod schemas generated from `database-generated.types.ts`. */
export const dbSchemasPath = path.join(
  repoRoot,
  'packages/db/src/database-generated.schemas.ts',
);

/** Prefix for ephemeral dirs used by `pnpm db schemas` (under repo root). */
export const dbSchemasTempDirPrefix = path.join(repoRoot, '.tmp-db-schemas-');

/**
 * Ephemeral `information_schema.columns` JSON from `supabase db query`.
 * Passed to the Zod generator via `DB_COLUMN_TYPES_PATH`.
 */
export const dbColumnTypesPath = path.join(repoRoot, '.tmp-db-column-types.json');
