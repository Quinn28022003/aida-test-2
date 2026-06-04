/**
 * Database types, migrations, and linked-project preparation.
 *
 * - `types` / `validate`: regenerate `database-generated.types.ts`, then Zod schemas.
 * - `validate` fails when linked cloud schema differs from git — not a health check.
 * - `schemas`: lower-level Zod generator for script development; normal flow uses `types`.
 * - `prepare`: linked cloud-dev pipeline (migrate up → rls sync → rpc sync → validate); no automatic migrate status.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { Command } from 'commander';

import { registerMigrateCommand, runMigrateUp } from './migrate.js';
import { registerRpcCommand, runRpcSync } from './rpc.js';
import { runRlsSync } from './rls.js';
import { assertPostgresUrl, mergeEnvForPostgresUrl } from '../lib/db-url.js';
import { dbColumnTypesPath, dbTypesPath, dbTypesTempPath, repoRoot } from '../lib/paths.js';
import { run, runCaptureWithRetry } from '../lib/run.js';

const columnTypesSqlPath = path.join(repoRoot, 'scripts/lib/column-types-query.sql');

const GENERATED_DB_PATHS = [
  'packages/db/src/database-generated.types.ts',
  'packages/db/src/database-generated.schemas.ts',
] as const;

const DB_EXAMPLES = `
Examples:
  pnpm db types
  pnpm db types --db-url postgresql://postgres:postgres@localhost:5432/test_db?sslmode=disable
  pnpm db validate
  pnpm db validate --db-url postgresql://postgres:postgres@localhost:5432/test_db?sslmode=disable
  pnpm db migrate status
  pnpm db migrate up
  pnpm db prepare
  pnpm db rpc sync
  pnpm db schemas
  pnpm db schemas --db-url postgresql://postgres:postgres@localhost:5432/test_db?sslmode=disable
  pnpm db schemas validate
`;

export type DbTargetOptions = {
  dbUrl?: string;
  /** Optional Docker-facing URL for `supabase gen types`; schema queries still use `dbUrl`. */
  genTypesDbUrl?: string;
  env?: Record<string, string>;
};

function resolveDbTarget(options: DbTargetOptions = {}) {
  const baseEnv = { ...(process.env as Record<string, string>), ...options.env };

  if (!options.dbUrl) {
    return {
      display: ['--linked'],
      env: baseEnv,
      genTypesTargetArgs: ['--linked'],
      queryTargetArgs: ['--linked'],
    };
  }

  const dbUrl = assertPostgresUrl(options.dbUrl);
  const genTypesDbUrl = assertPostgresUrl(options.genTypesDbUrl ?? dbUrl, '--gen-types-db-url');
  const env = mergeEnvForPostgresUrl(mergeEnvForPostgresUrl(baseEnv, dbUrl), genTypesDbUrl);

  return {
    display: ['--db-url', '<redacted>'],
    env,
    genTypesTargetArgs: ['--db-url', genTypesDbUrl],
    queryTargetArgs: ['--db-url', dbUrl],
  };
}

export async function runFetchColumnTypes(options: DbTargetOptions = {}): Promise<void> {
  const target = resolveDbTarget(options);
  const args = ['db', 'query', '--file', columnTypesSqlPath, ...target.queryTargetArgs, '-o', 'json', '--agent=no'];
  const displayArgs = [
    'db',
    'query',
    '--file',
    'scripts/lib/column-types-query.sql',
    ...target.display,
    '-o',
    'json',
    '--agent=no',
  ];
  const stdout = await runCaptureWithRetry('supabase', [...args], {
    displayArgs,
    env: target.env,
  });
  await fs.writeFile(dbColumnTypesPath, stdout);
}

export async function runDbSchemas(options: DbTargetOptions = {}): Promise<void> {
  await runFetchColumnTypes(options);
  await run('node', ['scripts/generate-db-zod-schemas.mjs'], {
    env: { DB_COLUMN_TYPES_PATH: dbColumnTypesPath },
  });
}

export async function runDbTypes(options: DbTargetOptions = {}): Promise<void> {
  const target = resolveDbTarget(options);
  const args = ['gen', 'types', 'typescript', ...target.genTypesTargetArgs, '--schema', 'public'];
  const displayArgs = ['gen', 'types', 'typescript', ...target.display, '--schema', 'public'];
  const stdout = await runCaptureWithRetry('supabase', [...args], {
    displayArgs,
    env: target.env,
  });
  await fs.writeFile(dbTypesTempPath, stdout);
  await fs.rename(dbTypesTempPath, dbTypesPath);
  await runDbSchemas(options);
}

export async function runDbValidate(options: DbTargetOptions = {}): Promise<void> {
  await runDbTypes(options);
  // Exit 1 if working tree differs from index — intentional gate before PR/commit.
  await run('git', ['diff', '--exit-code', ...GENERATED_DB_PATHS]);
}

export async function runDbSchemasValidate(options: DbTargetOptions = {}): Promise<void> {
  await runDbSchemas(options);
  await run('git', ['diff', '--exit-code', 'packages/db/src/database-generated.schemas.ts']);
}

/** Recommended once-per-clone setup after `supabase login` + `supabase link` (mutates linked DB). */
export async function runDbPrepare(): Promise<void> {
  await runMigrateUp({ env: 'development', force: false });
  // RLS creates helper functions that must be present before generated type validation.
  await runRlsSync();
  await runRpcSync();
  await runDbValidate();
}

export function registerDbCommand(program: Command): void {
  const db = program
    .command('db')
    .description('Database migrations, types, validation, and linked-project preparation')
    .addHelpText('after', DB_EXAMPLES)
    // No subcommand → show group help (exit 0).
    .action(() => {
      db.outputHelp();
      process.exit(0);
    });

  db.command('types')
    .description(
      'Regenerate database-generated.types.ts and database-generated.schemas.ts from the linked Supabase project or --db-url',
    )
    .option('--db-url <url>', 'Generate from a Postgres connection string instead of the linked Supabase project')
    .action(async (options: DbTargetOptions) => {
      await runDbTypes(options);
    });

  db.command('validate')
    .description(
      'Regenerate generated DB types and schemas from the linked project or --db-url; fail if either file differs from git',
    )
    .option('--db-url <url>', 'Validate against a Postgres connection string instead of the linked Supabase project')
    .action(async (options: DbTargetOptions) => {
      await runDbValidate(options);
    });

  registerMigrateCommand(db);
  registerRpcCommand(db);

  db.command('help')
    .description('Show database command help')
    .action(() => {
      db.outputHelp();
    });

  const schemas = db
    .command('schemas')
    .description(
      'Generate Zod schemas from database-generated.types.ts and information_schema on the linked project or --db-url',
    );

  schemas
    .command('validate')
    .description(
      'Regenerate database-generated.schemas.ts from the linked project or --db-url and fail if it differs from git',
    )
    .option(
      '--db-url <url>',
      'Validate schemas against a Postgres connection string instead of the linked Supabase project',
    )
    .action(async (options: DbTargetOptions) => {
      await runDbSchemasValidate(options);
    });

  schemas
    .option(
      '--db-url <url>',
      'Generate schemas from a Postgres connection string instead of the linked Supabase project',
    )
    .action(async (options: DbTargetOptions) => {
      await runDbSchemas(options);
    });

  db.command('prepare')
    .description(
      'Full linked-project prep: db migrate up → rls sync → rpc sync → validate (run db migrate status separately if needed)',
    )
    .action(async () => {
      await runDbPrepare();
    });
}
