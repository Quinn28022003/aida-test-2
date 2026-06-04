/**
 * Helpers for ephemeral hand-written RPC Supabase migrations.
 */

import { join, resolve } from 'path';

import { readdirSync } from 'fs';

import {
  listMigrationFiles,
  migrationVersionFromFilename,
} from '../rls/migration-path.mjs';

export const RPC_SQL_DIR = 'scripts/rpc/sql';
export const RPC_SQL_FILENAME_PATTERN = /^\d{3}-.+\.sql$/;
export const RPC_SYNC_SUFFIX = '_rpc_sync.sql';
/** @deprecated Legacy ephemeral suffix — still detected for stale-file cleanup. */
export const LEGACY_BOOTSTRAP_SYNC_SUFFIX = '_bootstrap_organization_sync.sql';

/** @param {string} rpcSqlDir */
export function listCanonicalRpcSqlFilenames(rpcSqlDir = RPC_SQL_DIR) {
  const absoluteDir = resolve(rpcSqlDir);
  return readdirSync(absoluteDir)
    .filter((name) => RPC_SQL_FILENAME_PATTERN.test(name))
    .sort();
}

/** @param {string} rpcSqlDir */
export function listCanonicalRpcSqlFiles(rpcSqlDir = RPC_SQL_DIR) {
  return listCanonicalRpcSqlFilenames(rpcSqlDir).map((name) => join(resolve(rpcSqlDir), name));
}

/** @param {string} migrationsDir */
export function listRpcSyncMigrations(migrationsDir = 'supabase/migrations') {
  return listMigrationFiles(migrationsDir).filter(
    (file) => file.endsWith(RPC_SYNC_SUFFIX) || file.endsWith(LEGACY_BOOTSTRAP_SYNC_SUFFIX),
  );
}

/** @param {string} migrationsDir */
export function nextRpcSyncMigrationFilename(migrationsDir = 'supabase/migrations') {
  const versions = listMigrationFiles(migrationsDir).map((migrationPath) => {
    const filename = migrationPath.split('/').pop();
    return migrationVersionFromFilename(filename);
  });

  const latestVersion = versions.sort()[versions.length - 1];
  if (!latestVersion) {
    throw new Error('Cannot create RPC sync migration because no Supabase migrations exist.');
  }

  const nextVersion = String(Number(latestVersion) + 1).padStart(latestVersion.length, '0');
  return `${nextVersion}_rpc_sync.sql`;
}

/** @param {string} migrationsDir */
export function rpcSyncMigrationPath(migrationsDir = 'supabase/migrations') {
  return resolve(join(migrationsDir, nextRpcSyncMigrationFilename(migrationsDir)));
}
