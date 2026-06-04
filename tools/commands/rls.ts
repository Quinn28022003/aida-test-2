/**
 * RLS apply and integration tests — thin wrapper around `scripts/rls/*`.
 *
 * Default mode is linked: run after `supabase link --project-ref` (cloud dev, staging/master deploy).
 * Set `RLS_SYNC_MODE=db-url` only for CI database-dry-run or local disposable Postgres.
 * See scripts/rls/sync-rls-sql.mjs.
 */
import { Command } from 'commander';

import { run } from '../lib/run.js';

const RLS_EXAMPLES = `
Examples:
  # Linked Supabase project (default — after supabase link)
  pnpm rls sync

  # Ephemeral Postgres only (CI dry-run / disposable DB)
  RLS_SYNC_MODE=db-url DATABASE_URL=postgresql://... pnpm rls sync

  pnpm rls test
`;

export async function runRlsSync(): Promise<void> {
  // Authz source of truth must be built before SQL generation (ADR 0002).
  await run('pnpm', ['--filter', '@aida/contracts', 'build']);
  await run('node', ['scripts/rls/sync-rls-sql.mjs']);
}

export async function runRlsTest(): Promise<void> {
  await run('node', ['scripts/rls/test/run-tests.mjs']);
}

export function registerRlsCommand(program: Command): void {
  const rls = program
    .command('rls')
    .description('RLS generation and integration tests')
    .addHelpText('after', RLS_EXAMPLES)
    // No subcommand → show group help (exit 0).
    .action(() => {
      rls.outputHelp();
      process.exit(0);
    });

  rls
    .command('sync')
    .description(
      'Build contracts, generate SQL, and apply RLS via ephemeral Supabase migration (linked project by default)',
    )
    .action(async () => {
      await runRlsSync();
    });

  rls
    .command('test')
    .description('Run RLS integration tests (CI / disposable Postgres)')
    .action(async () => {
      await runRlsTest();
    });
}
