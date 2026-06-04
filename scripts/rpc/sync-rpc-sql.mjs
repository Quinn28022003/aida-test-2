#!/usr/bin/env node
/* eslint-disable preserve-caught-error */
/* eslint-disable no-undef */
/**
 * Apply hand-written PostgreSQL RPCs via an ephemeral Supabase migration:
 * combine numbered SQL files → db push → repair reverted → delete file.
 *
 * Environment: reads only process.env (shell / GitHub Actions). Does not load app .env files.
 *
 * Targeting (RPC_SYNC_MODE):
 * - linked (default): after `supabase link --project-ref` — staging/master deploy, local cloud dev
 * - db-url: only for database-dry-run / disposable Postgres — never for real Supabase deploy jobs
 *   (via RPC_SYNC_DATABASE_URL or DATABASE_URL; --db-url on db push + migration repair only)
 *
 * Run after `pnpm rls sync` when RPCs depend on RLS helpers (e.g. current_profile_id()).
 * Canonical SQL: scripts/rpc/sql/NNN-name.sql — each file drops its overloads then CREATE FUNCTION fresh.
 */

import { execFileSync } from 'child_process';
import { unlinkSync, writeFileSync } from 'fs';

import { RPC_SYNC_SUFFIX, rpcSyncMigrationPath } from './migration-path.mjs';
import {
  assertRpcSyncMigrationDoesNotExist,
  cleanupStaleLocalRpcSyncMigrations,
  readCombinedRpcSql,
  resolveDbUrlForDbUrlMode,
  resolveRpcSyncMode,
} from './sync-helpers.mjs';
import { migrationVersionFromFilename } from '../rls/migration-path.mjs';

const rpcSyncMode = resolveRpcSyncMode(process.env);
const rpcSyncDbUrl = rpcSyncMode === 'db-url' ? resolveDbUrlForDbUrlMode(process.env) : null;

if (rpcSyncMode === 'db-url') {
  console.log('RPC sync mode: db-url (Postgres connection string)');
} else {
  console.log('RPC sync mode: linked (supabase link)');
}

function runSupabase(args, { useDbUrl = false } = {}) {
  const dbUrlArgs = rpcSyncMode === 'db-url' && useDbUrl && rpcSyncDbUrl ? ['--db-url', rpcSyncDbUrl] : [];
  const supabaseArgs = dbUrlArgs.length > 0 ? [...args.slice(0, 2), ...dbUrlArgs, ...args.slice(2)] : args;
  const env = { ...process.env };
  if (rpcSyncDbUrl?.includes('sslmode=disable')) {
    env.PGSSLMODE = 'disable';
  }

  execFileSync('pnpm', ['exec', 'supabase', ...supabaseArgs], {
    stdio: 'inherit',
    env,
  });
}

function cleanupEphemeralMigration(migrationPath) {
  const filename = migrationPath.split('/').pop();
  const version = migrationVersionFromFilename(filename);

  runSupabase(['migration', 'repair', version, '--status', 'reverted'], { useDbUrl: true });
  unlinkSync(migrationPath);
}

function main() {
  const cleanedMigrations = cleanupStaleLocalRpcSyncMigrations({
    repairMigration(version) {
      runSupabase(['migration', 'repair', version, '--status', 'reverted'], { useDbUrl: true });
    },
  });

  if (cleanedMigrations.length > 0) {
    console.log(`Cleaned stale local RPC sync migration file(s): ${cleanedMigrations.length}`);
  }

  const sql = readCombinedRpcSql();
  const migrationPath = rpcSyncMigrationPath();
  assertRpcSyncMigrationDoesNotExist(migrationPath);

  const ephemeralNotice = '-- Ephemeral Supabase migration — applied by pnpm db rpc sync; do not commit.\n\n';
  writeFileSync(migrationPath, ephemeralNotice + sql);

  console.log(`Applying ephemeral RPC migration: ${migrationPath}`);

  try {
    runSupabase(['db', 'push', '--yes'], { useDbUrl: true });
  } catch (error) {
    console.error(`Error: RPC migration apply failed. Ephemeral file kept for debugging: ${migrationPath}`);
    throw error;
  }

  cleanupEphemeralMigration(migrationPath);

  console.log(`RPC sync applied via Supabase migration (${RPC_SYNC_SUFFIX}).`);
}

try {
  main();
} catch (error) {
  console.error(`Error syncing RPC SQL: ${error.message}`);
  process.exit(1);
}
