/**
 * Supabase schema migrations (`supabase/migrations/*.sql`).
 *
 * Default target: whatever `supabase link` points at.
 * `db migrate up --db-url` targets ephemeral/disposable Postgres (CI dry-run) without link.
 * `--env` only sets NODE_ENV on child processes — not project ref / branch.
 */
import { Command } from 'commander';

import { requireProductionConfirm } from '../lib/confirm.js';
import {
  assertPostgresUrl,
  mergeEnvForPostgresUrl,
} from '../lib/db-url.js';
import { envVarsFor, parseEnv, printResolvedEnv, type AppEnv } from '../lib/env.js';
import { run } from '../lib/run.js';

const MIGRATE_EXAMPLES = `
Examples:
  pnpm db migrate new add_users_table
  pnpm db migrate status
  pnpm db migrate status --env production
  pnpm db migrate up
  pnpm db migrate up --force
  pnpm db migrate up --db-url "$DATABASE_URL" --yes --debug
  pnpm db migrate down
  pnpm db migrate down --env production --confirm production
  pnpm db migrate up --env production --force --confirm production
`;

export type MigrateUpOptions = {
  env: AppEnv;
  force: boolean;
  confirm?: string;
  dbUrl?: string;
  yes?: boolean;
  debug?: boolean;
};

export async function runMigrateStatus(env: AppEnv): Promise<void> {
  printResolvedEnv(env);
  await run('supabase', ['migration', 'list'], { env: envVarsFor(env) });
}

export async function runMigrateUp(options: MigrateUpOptions): Promise<void> {
  const { env, force, confirm, dbUrl, yes, debug } = options;
  // Production `up` without `--force` is allowed; only `--force` needs `--confirm production`.
  if (env === 'production' && force) {
    requireProductionConfirm(env, confirm, 'db migrate up --force');
  }
  printResolvedEnv(env);
  if (dbUrl) {
    console.log('Targeting: ephemeral Postgres (--db-url)');
  }
  if (force) {
    console.warn(
      'Warning: --force will pass Supabase --include-all to db push. Use only when the team agrees to reconcile odd migration history.',
    );
  }
  const args = ['db', 'push'];
  if (dbUrl) {
    args.push('--db-url', assertPostgresUrl(dbUrl));
  }
  // `--force` maps to Supabase `--include-all` (reconcile odd migration history; team agreement).
  if (force) {
    args.push('--include-all');
  }
  if (yes) {
    args.push('--yes');
  }
  if (debug) {
    args.push('--debug');
  }
  let childEnv = envVarsFor(env);
  if (dbUrl) {
    childEnv = mergeEnvForPostgresUrl(childEnv, dbUrl);
  }
  await run('supabase', args, { env: childEnv });
}

export async function runMigrateDown(
  env: AppEnv,
  confirm: string | undefined,
): Promise<void> {
  requireProductionConfirm(env, confirm, 'db migrate down');
  printResolvedEnv(env);
  // Adjusts remote migration history only — not a full schema rewind (see Supabase docs).
  await run(
    'supabase',
    ['migration', 'down', '--linked', '--last', '1'],
    { env: envVarsFor(env) },
  );
}

export function registerMigrateCommand(program: Command): void {
  const migrate = program
    .command('migrate')
    .description('Supabase schema migrations (target project: supabase link)')
    .addHelpText('after', MIGRATE_EXAMPLES)
    // No subcommand → show group help (exit 0).
    .action(() => {
      migrate.outputHelp();
      process.exit(0);
    });

  migrate
    .command('new')
    .description('Create a new migration file under supabase/migrations/')
    .argument('<name>', 'Migration name (snake_case)')
    .action(async (name: string) => {
      await run('supabase', ['migration', 'new', name]);
    });

  /** Shared `--env` on status/up/down; `db migrate new` intentionally has no env flag. */
  const envOption = (cmd: Command) =>
    cmd.option(
      '--env <env>',
      'Sets NODE_ENV (development | production); default development. Does not change supabase link.',
      'development',
    );

  envOption(
    migrate
      .command('status')
      .description('List local migration files vs remote recorded versions'),
  ).action(async (opts: { env: string }) => {
    await runMigrateStatus(parseEnv(opts.env));
  });

  envOption(
    migrate
      .command('up')
      .description(
        'Apply pending migrations (db push); linked project by default, or --db-url for ephemeral Postgres',
      )
      .option(
        '--db-url <url>',
        'Postgres URL for CI/disposable DB (postgres:// or postgresql://); does not use supabase link',
      )
      .option('--yes', 'Non-interactive db push (typical with --db-url in CI)')
      .option('--debug', 'Pass --debug to supabase db push')
      .option('--force', 'Pass --include-all to db push (team agreement required)')
      .option(
        '--confirm <value>',
        'Required as --confirm production for db migrate up --env production --force',
      ),
  ).action(
    async (opts: {
      env: string;
      dbUrl?: string;
      yes?: boolean;
      debug?: boolean;
      force?: boolean;
      confirm?: string;
    }) => {
      await runMigrateUp({
        env: parseEnv(opts.env),
        force: Boolean(opts.force),
        confirm: opts.confirm,
        dbUrl: opts.dbUrl,
        yes: Boolean(opts.yes),
        debug: Boolean(opts.debug),
      });
    },
  );

  envOption(
    migrate
      .command('down')
      .description('Roll back the last linked migration record (destructive — careful)')
      .option(
        '--confirm <value>',
        'Required as --confirm production for db migrate down --env production',
      ),
  ).action(async (opts: { env: string; confirm?: string }) => {
    await runMigrateDown(parseEnv(opts.env), opts.confirm);
  });
}
