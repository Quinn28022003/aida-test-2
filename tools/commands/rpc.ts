/**
 * Hand-written PostgreSQL RPC sync — thin wrapper around `scripts/rpc/*`.
 *
 * Default mode is linked: run after `supabase link --project-ref` (cloud dev, staging/master deploy).
 * Set `RPC_SYNC_MODE=db-url` only for CI database-dry-run or local disposable Postgres.
 * Applies all numbered SQL files under scripts/rpc/sql/ (NNN-name.sql) in one ephemeral migration.
 */
import { Command } from 'commander';

import { run } from '../lib/run.js';

const RPC_EXAMPLES = `
Examples:
  # Linked Supabase project (default — after supabase link)
  pnpm db rpc sync

  # Ephemeral Postgres only (CI dry-run / disposable DB)
  RPC_SYNC_MODE=db-url DATABASE_URL=postgresql://... pnpm db rpc sync
`;

export async function runRpcSync(): Promise<void> {
  await run('node', ['scripts/rpc/sync-rpc-sql.mjs']);
}

export function registerRpcCommand(db: Command): void {
  const rpc = db
    .command('rpc')
    .description('Hand-written PostgreSQL RPC ephemeral sync')
    .addHelpText('after', RPC_EXAMPLES)
    .action(() => {
      rpc.outputHelp();
      process.exit(0);
    });

  rpc
    .command('sync')
    .description(
      'Combine scripts/rpc/sql/NNN-*.sql and apply via ephemeral Supabase migration (linked project by default; run after pnpm rls sync when RPCs use RLS helpers)',
    )
    .action(async () => {
      await runRpcSync();
    });
}
