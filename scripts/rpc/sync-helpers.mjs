/**
 * Helpers for ephemeral hand-written RPC sync.
 */

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { basename } from 'path';

import {
  LEGACY_BOOTSTRAP_SYNC_SUFFIX,
  RPC_SQL_DIR,
  RPC_SYNC_SUFFIX,
  listCanonicalRpcSqlFiles,
  listRpcSyncMigrations,
} from './migration-path.mjs';
import { migrationVersionFromFilename } from '../rls/migration-path.mjs';

export const POSTGRES_URL_PREFIXES = ['postgres://', 'postgresql://'];
export const RPC_SYNC_MODES = ['linked', 'db-url'];

/** @param {unknown} url */
export function isPostgresUrl(url) {
  return typeof url === 'string' && POSTGRES_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/** @param {NodeJS.ProcessEnv} env */
export function resolveRpcSyncMode(env) {
  const mode = env.RPC_SYNC_MODE ?? 'linked';
  if (!RPC_SYNC_MODES.includes(mode)) {
    throw new Error(`Invalid RPC_SYNC_MODE="${mode}". Use "linked" or "db-url".`);
  }
  return mode;
}

/** @param {NodeJS.ProcessEnv} env */
export function resolveDbUrlForDbUrlMode(env) {
  const url = env.RPC_SYNC_DATABASE_URL ?? env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'RPC_SYNC_MODE=db-url requires RPC_SYNC_DATABASE_URL or DATABASE_URL (postgres:// or postgresql://).',
    );
  }
  if (!isPostgresUrl(url)) {
    throw new Error(
      'RPC_SYNC_MODE=db-url requires a Postgres connection string (postgres:// or postgresql://). DATABASE_URL=https://...supabase.co is an app URL, not a valid Supabase CLI --db-url.',
    );
  }
  return url;
}

/** @param {string} rpcSqlDir */
export function readCombinedRpcSql(rpcSqlDir = RPC_SQL_DIR) {
  const files = listCanonicalRpcSqlFiles(rpcSqlDir);
  if (files.length === 0) {
    throw new Error(
      `No RPC SQL files found in ${rpcSqlDir}/ (expected NNN-name.sql, e.g. 001-bootstrap-organization.sql).`,
    );
  }

  return files
    .map((filePath) => {
      const name = basename(filePath);
      return `-- RPC source: ${name}\n\n${readFileSync(filePath, 'utf8').trim()}\n`;
    })
    .join('\n');
}

/** @param {string} migrationsDir */
export function assertNoStaleLocalRpcSyncMigrations(migrationsDir = 'supabase/migrations') {
  const staleMigrations = listRpcSyncMigrations(migrationsDir);
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
      'Found stale local RPC sync migration file(s).',
      'These files are ephemeral and must be repaired/removed before creating a new RPC sync migration.',
      details,
    ].join('\n'),
  );
}

/**
 * @param {{
 *   migrationsDir?: string,
 *   repairMigration: (version: string, migrationPath: string) => void,
 * }} options
 */
export function cleanupStaleLocalRpcSyncMigrations({ migrationsDir = 'supabase/migrations', repairMigration }) {
  const staleMigrations = listRpcSyncMigrations(migrationsDir);
  if (staleMigrations.length === 0) {
    return [];
  }

  if (typeof repairMigration !== 'function') {
    throw new Error('cleanupStaleLocalRpcSyncMigrations requires a repairMigration callback.');
  }

  return staleMigrations.map((migrationPath) => {
    const filename = migrationPath.split('/').pop();
    const version = migrationVersionFromFilename(filename);

    repairMigration(version, migrationPath);
    unlinkSync(migrationPath);

    return migrationPath;
  });
}

/** @param {string} migrationPath */
export function assertRpcSyncMigrationDoesNotExist(migrationPath) {
  if (existsSync(migrationPath)) {
    throw new Error(`Refusing to overwrite existing migration file: ${migrationPath}`);
  }
}

export { LEGACY_BOOTSTRAP_SYNC_SUFFIX, RPC_SQL_DIR, RPC_SYNC_SUFFIX, listCanonicalRpcSqlFiles, listRpcSyncMigrations };
