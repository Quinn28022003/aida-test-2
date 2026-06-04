import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { listCanonicalRpcSqlFilenames, nextRpcSyncMigrationFilename } from './migration-path.mjs';
import {
  assertNoStaleLocalRpcSyncMigrations,
  cleanupStaleLocalRpcSyncMigrations,
  isPostgresUrl,
  readCombinedRpcSql,
  resolveDbUrlForDbUrlMode,
  resolveRpcSyncMode,
} from './sync-helpers.mjs';

describe('resolveRpcSyncMode', () => {
  it('defaults to linked', () => {
    expect(resolveRpcSyncMode({})).toBe('linked');
  });

  it('accepts db-url', () => {
    expect(resolveRpcSyncMode({ RPC_SYNC_MODE: 'db-url' })).toBe('db-url');
  });

  it('rejects invalid sync mode', () => {
    expect(() => resolveRpcSyncMode({ RPC_SYNC_MODE: 'invalid' })).toThrow(
      'Invalid RPC_SYNC_MODE="invalid". Use "linked" or "db-url".',
    );
  });
});

describe('resolveDbUrlForDbUrlMode', () => {
  it('requires a Postgres connection string', () => {
    expect(() =>
      resolveDbUrlForDbUrlMode({ RPC_SYNC_MODE: 'db-url', DATABASE_URL: 'https://abc.supabase.co' }),
    ).toThrow('RPC_SYNC_MODE=db-url requires a Postgres connection string (postgres:// or postgresql://).');
  });

  it('accepts postgres:// DATABASE_URL', () => {
    expect(
      resolveDbUrlForDbUrlMode({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
      }),
    ).toBe('postgresql://postgres:postgres@localhost:5432/postgres');
  });

  it('prefers RPC_SYNC_DATABASE_URL over DATABASE_URL', () => {
    expect(
      resolveDbUrlForDbUrlMode({
        RPC_SYNC_DATABASE_URL: 'postgresql://rpc:secret@localhost:5432/postgres',
        DATABASE_URL: 'postgresql://other:secret@localhost:5432/postgres',
      }),
    ).toBe('postgresql://rpc:secret@localhost:5432/postgres');
  });
});

describe('isPostgresUrl', () => {
  it('accepts postgres and postgresql prefixes', () => {
    expect(isPostgresUrl('postgres://localhost/db')).toBe(true);
    expect(isPostgresUrl('postgresql://localhost/db')).toBe(true);
  });

  it('rejects non-Postgres URLs', () => {
    expect(isPostgresUrl('https://abc.supabase.co')).toBe(false);
  });
});

describe('listCanonicalRpcSqlFilenames', () => {
  it('returns numbered SQL files in sort order', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '002-create-project.sql'), 'select 2;');
    writeFileSync(join(tempDir, '001-bootstrap-organization.sql'), 'select 1;');
    writeFileSync(join(tempDir, 'README.md'), 'ignore');
    writeFileSync(join(tempDir, 'bootstrap.sql'), 'ignore');

    expect(listCanonicalRpcSqlFilenames(tempDir)).toEqual(['001-bootstrap-organization.sql', '002-create-project.sql']);
  });
});

describe('readCombinedRpcSql', () => {
  it('combines files with source headers', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '001-alpha.sql'), 'select 1;');
    writeFileSync(join(tempDir, '002-beta.sql'), 'select 2;');

    const combined = readCombinedRpcSql(tempDir);

    expect(combined).toContain('-- RPC source: 001-alpha.sql');
    expect(combined).toContain('select 1;');
    expect(combined).toContain('-- RPC source: 002-beta.sql');
    expect(combined).toContain('select 2;');
  });

  it('throws when no numbered SQL files exist', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));

    expect(() => readCombinedRpcSql(tempDir)).toThrow('No RPC SQL files found');
  });
});

describe('assertNoStaleLocalRpcSyncMigrations', () => {
  let tempDir;

  afterEach(() => {
    tempDir = undefined;
  });

  it('passes when no stale RPC sync files exist', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '20260101000000_initial.sql'), 'select 1;');

    expect(() => assertNoStaleLocalRpcSyncMigrations(tempDir)).not.toThrow();
  });

  it('detects stale local rpc sync migration files', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '20260101000000_initial.sql'), 'select 1;');
    const stalePath = join(tempDir, '20260102000000_rpc_sync.sql');
    writeFileSync(stalePath, 'select 1;');

    expect(() => assertNoStaleLocalRpcSyncMigrations(tempDir)).toThrow('Found stale local RPC sync migration file(s).');
    expect(() => assertNoStaleLocalRpcSyncMigrations(tempDir)).toThrow(stalePath);
  });

  it('detects legacy bootstrap organization sync migration files', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '20260101000000_initial.sql'), 'select 1;');
    const stalePath = join(tempDir, '20260102000000_bootstrap_organization_sync.sql');
    writeFileSync(stalePath, 'select 1;');

    expect(() => assertNoStaleLocalRpcSyncMigrations(tempDir)).toThrow(stalePath);
  });
});

describe('cleanupStaleLocalRpcSyncMigrations', () => {
  it('repairs and removes stale RPC sync migration files', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    const stalePath = join(tempDir, '20260102000000_rpc_sync.sql');
    const repaired = [];
    writeFileSync(join(tempDir, '20260101000000_initial.sql'), 'select 1;');
    writeFileSync(stalePath, 'select 1;');

    const cleaned = cleanupStaleLocalRpcSyncMigrations({
      migrationsDir: tempDir,
      repairMigration(version, migrationPath) {
        repaired.push({ version, migrationPath });
      },
    });

    expect(cleaned).toEqual([stalePath]);
    expect(repaired).toEqual([{ version: '20260102000000', migrationPath: stalePath }]);
    expect(existsSync(stalePath)).toBe(false);
  });

  it('does nothing when no stale RPC sync migration files exist', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '20260101000000_initial.sql'), 'select 1;');

    const cleaned = cleanupStaleLocalRpcSyncMigrations({
      migrationsDir: tempDir,
      repairMigration() {
        throw new Error('repair should not run');
      },
    });

    expect(cleaned).toEqual([]);
  });
});

describe('nextRpcSyncMigrationFilename', () => {
  it('generates the next versioned RPC sync filename', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'rpc-sync-test-'));
    writeFileSync(join(tempDir, '20260528172900_example.sql'), 'select 1;');

    expect(nextRpcSyncMigrationFilename(tempDir)).toBe('20260528172901_rpc_sync.sql');
  });
});
