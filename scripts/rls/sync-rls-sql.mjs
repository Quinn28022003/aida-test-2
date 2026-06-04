#!/usr/bin/env node
/* eslint-disable preserve-caught-error */
/* eslint-disable no-undef */
/**
 * Generate and apply RLS SQL via an ephemeral Supabase migration:
 * migration new → write SQL → db push → repair reverted → delete file.
 *
 * Environment: reads only process.env (shell / GitHub Actions). Does not load app .env files.
 *
 * Targeting (RLS_SYNC_MODE):
 * - linked (default): Supabase CLI uses `supabase link`; no --db-url
 * - db-url: CI / disposable Postgres via RLS_SYNC_DATABASE_URL or DATABASE_URL
 *   (--db-url passed only to `db push` and `migration repair`, not `migration new`)
 */

import { execFileSync } from 'child_process';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { generateRlsSql } from './generate-rls-sql.mjs';
import {
  MIGRATIONS_DIR,
  listMigrationFiles,
  listRlsSyncMigrations,
  migrationVersionFromFilename,
} from './migration-path.mjs';

const POSTGRES_URL_PREFIXES = ['postgres://', 'postgresql://'];
const RLS_SYNC_MODES = ['linked', 'db-url'];

function isPostgresUrl(url) {
  return typeof url === 'string' && POSTGRES_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function resolveRlsSyncMode() {
  const mode = process.env.RLS_SYNC_MODE ?? 'linked';
  if (!RLS_SYNC_MODES.includes(mode)) {
    throw new Error(`Invalid RLS_SYNC_MODE="${mode}". Use "linked" or "db-url".`);
  }
  return mode;
}

function resolveDbUrlForDbUrlMode() {
  const url = process.env.RLS_SYNC_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'RLS_SYNC_MODE=db-url requires RLS_SYNC_DATABASE_URL or DATABASE_URL (postgres:// or postgresql://).',
    );
  }
  if (!isPostgresUrl(url)) {
    throw new Error(
      'RLS_SYNC_MODE=db-url requires a Postgres connection string (postgres:// or postgresql://). DATABASE_URL=https://...supabase.co is an app URL, not a valid Supabase CLI --db-url.',
    );
  }
  return url;
}

const rlsSyncMode = resolveRlsSyncMode();
const rlsSyncDbUrl = rlsSyncMode === 'db-url' ? resolveDbUrlForDbUrlMode() : null;

if (rlsSyncMode === 'db-url') {
  console.log('RLS sync mode: db-url (Postgres connection string)');
} else {
  console.log('RLS sync mode: linked (supabase link)');
}

function runSupabase(args, { useDbUrl = false } = {}) {
  const dbUrlArgs =
    rlsSyncMode === 'db-url' && useDbUrl && rlsSyncDbUrl ? ['--db-url', rlsSyncDbUrl] : [];
  const supabaseArgs = dbUrlArgs.length > 0 ? [...args.slice(0, 2), ...dbUrlArgs, ...args.slice(2)] : args;
  const env = { ...process.env };
  if (rlsSyncDbUrl?.includes('sslmode=disable')) {
    env.PGSSLMODE = 'disable';
  }

  execFileSync('pnpm', ['exec', 'supabase', ...supabaseArgs], {
    stdio: 'inherit',
    env,
  });
}

function nextMigrationVersion() {
  const versions = listMigrationFiles().map((migrationPath) => {
    const filename = migrationPath.split('/').pop();
    return migrationVersionFromFilename(filename);
  });

  const latestVersion = versions.sort()[versions.length - 1];
  if (!latestVersion) {
    throw new Error('Cannot create RLS sync migration because no Supabase migrations exist.');
  }

  return String(Number(latestVersion) + 1).padStart(latestVersion.length, '0');
}

function createRlsSyncMigration() {
  const migrationPath = resolve(join(MIGRATIONS_DIR, `${nextMigrationVersion()}_rls_sync.sql`));
  if (existsSync(migrationPath)) {
    throw new Error(`Refusing to overwrite existing migration file: ${migrationPath}`);
  }

  return migrationPath;
}

function assertNoStaleLocalRlsSyncMigrations() {
  const staleMigrations = listRlsSyncMigrations();
  if (staleMigrations.length === 0) {
    return;
  }

  const details = staleMigrations
    .map((migrationPath) => {
      const filename = migrationPath.split('/').pop();
      const version = migrationVersionFromFilename(filename);
      return [
        `- ${migrationPath}`,
        `  repair remote history: pnpm exec supabase migration repair --status reverted ${version}`,
        `  remove local file: rm ${migrationPath}`,
      ].join('\n');
    })
    .join('\n');

  throw new Error(
    [
      'Found stale local RLS sync migration file(s).',
      'These files are ephemeral and must be repaired/removed before creating a new RLS sync migration.',
      details,
    ].join('\n'),
  );
}

function cleanupEphemeralMigration(migrationPath) {
  const filename = migrationPath.split('/').pop();
  const version = migrationVersionFromFilename(filename);

  runSupabase(['migration', 'repair', version, '--status', 'reverted'], { useDbUrl: true });
  unlinkSync(migrationPath);
}

async function main() {
  assertNoStaleLocalRlsSyncMigrations();

  const { sql, summary } = await generateRlsSql();
  const migrationPath = createRlsSyncMigration();

  const ephemeralNotice =
    '-- Ephemeral Supabase migration — applied by pnpm rls sync; do not commit.\n\n';
  writeFileSync(migrationPath, ephemeralNotice + sql);

  console.log(`Applying ephemeral RLS migration: ${migrationPath}`);

  try {
    runSupabase(['db', 'push', '--yes'], { useDbUrl: true });
  } catch (error) {
    console.error(
      `Error: RLS migration apply failed. Ephemeral file kept for debugging: ${migrationPath}`,
    );
    throw error;
  }

  cleanupEphemeralMigration(migrationPath);

  console.log(
    `RLS sync applied via Supabase migration: helpers=${summary.helperFunctions}, permissions=${summary.permissions}, roles=${summary.roles}, role_permissions=${summary.rolePermissions}, tables=${summary.rlsTables}, policies=${summary.policies}`,
  );
}

main().catch((error) => {
  console.error(`Error syncing RLS: ${error.message}`);
  process.exit(1);
});
