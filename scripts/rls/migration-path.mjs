/**
 * Helpers for ephemeral RLS Supabase migrations.
 */

import { readdirSync } from 'fs';
import { join, resolve } from 'path';

export const MIGRATIONS_DIR = 'supabase/migrations';
export const RLS_SYNC_SUFFIX = '_rls_sync.sql';

/** @param {string} filename */
export function migrationVersionFromFilename(filename) {
  const match = filename.match(/^(\d+)_/);
  if (!match) {
    throw new Error(`Invalid migration filename: ${filename}`);
  }
  return match[1];
}

/** @returns {string | null} */
export function findLatestRlsSyncMigration(migrationsDir = MIGRATIONS_DIR) {
  const files = listRlsSyncMigrations(migrationsDir);

  if (files.length === 0) {
    return null;
  }

  return files[files.length - 1];
}

/** @returns {string[]} */
export function listMigrationFiles(migrationsDir = MIGRATIONS_DIR) {
  const absoluteDir = resolve(migrationsDir);
  return readdirSync(absoluteDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((file) => join(absoluteDir, file));
}

/** @returns {string[]} */
export function listRlsSyncMigrations(migrationsDir = MIGRATIONS_DIR) {
  return listMigrationFiles(migrationsDir).filter((file) => file.endsWith(RLS_SYNC_SUFFIX));
}
