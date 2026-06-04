/**
 * Repo generation workflow.
 *
 * `generate` updates API artifacts and deterministic DB artifacts
 * from a disposable pgvector Postgres built from repo migrations plus generated RLS.
 */
import { Command } from 'commander';
import { Socket } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname } from 'node:path';

import { runApiGenerate } from './api.js';
import { runDbTypes } from './db.js';
import { run, runCapture } from '../lib/run.js';

const API_GENERATED_PATHS = [
  'apps/api-gateway/openapi/internal.openapi.json',
  'apps/api-gateway/openapi/public.openapi.json',
  'packages/api-client/src/generated',
] as const;

const DB_GENERATED_PATHS = [
  'packages/db/src/database-generated.types.ts',
  'packages/db/src/database-generated.schemas.ts',
] as const;

const DOCKER_IMAGE = 'pgvector/pgvector:pg16';
const DOCKER_COMMAND_CANDIDATES = [
  process.env.DOCKER_COMMAND,
  'docker',
  '/Applications/Docker.app/Contents/Resources/bin/docker',
  '/opt/homebrew/bin/docker',
  '/usr/local/bin/docker',
].filter((candidate): candidate is string => Boolean(candidate));
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_DB = 'test_db';

type GenerateOptions = {
  skipGitAdd?: boolean;
};

type EphemeralDb = {
  container: string;
  databaseUrl: string;
  dockerDatabaseUrl: string;
};

function dockerEnv(dockerCommand: string): Record<string, string> {
  if (!dockerCommand.includes('/')) {
    return process.env as Record<string, string>;
  }

  return {
    ...process.env,
    PATH: `${dirname(dockerCommand)}:${process.env.PATH ?? ''}`,
  } as Record<string, string>;
}

function dockerUnavailableMessage(): string {
  return [
    'Docker is required for deterministic DB type generation.',
    'Install Docker Desktop or Colima, then rerun pnpm generate.',
  ].join(' ');
}

function candidateHostAddresses(): string[] {
  const candidates = new Set<string>();
  if (process.env.AIDA_CODEGEN_DB_HOST) {
    candidates.add(process.env.AIDA_CODEGEN_DB_HOST);
  }

  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        candidates.add(entry.address);
      }
    }
  }

  candidates.add('host.docker.internal');
  candidates.add('127.0.0.1');
  return [...candidates];
}

function canConnectFromHost(host: string, port: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(2_000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(Number(port), host);
  });
}

async function canConnectFromDocker(dockerCommand: string, host: string, port: string): Promise<boolean> {
  try {
    await runCapture(
      dockerCommand,
      [
        'run',
        '--rm',
        DOCKER_IMAGE,
        'pg_isready',
        '-h',
        host,
        '-p',
        port,
        '-U',
        POSTGRES_USER,
        '-d',
        POSTGRES_DB,
        '-t',
        '3',
      ],
      { env: dockerEnv(dockerCommand) },
    );
    return true;
  } catch {
    return false;
  }
}

async function resolveHostReachableAddress(dockerCommand: string, port: string): Promise<string> {
  for (const host of candidateHostAddresses()) {
    if ((await canConnectFromHost(host, port)) && (await canConnectFromDocker(dockerCommand, host, port))) {
      return host;
    }
  }

  throw new Error(
    'Could not find a host address reachable from both this machine and Docker. Set AIDA_CODEGEN_DB_HOST to a reachable host IPv4 address, then rerun pnpm generate.',
  );
}

async function resolveDockerCommand(): Promise<string | null> {
  for (const command of DOCKER_COMMAND_CANDIDATES) {
    try {
      await runCapture(command, ['version', '--format', '{{.Server.Version}}'], {
        env: dockerEnv(command),
      });
      return command;
    } catch {
      // Try the next known Docker CLI location.
    }
  }

  return null;
}

async function startEphemeralDb(dockerCommand: string): Promise<EphemeralDb> {
  const container = `aida-codegen-db-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    await run(
      dockerCommand,
      [
        'run',
        '-d',
        '--rm',
        '--name',
        container,
        '-e',
        `POSTGRES_USER=${POSTGRES_USER}`,
        '-e',
        `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`,
        '-e',
        `POSTGRES_DB=${POSTGRES_DB}`,
        '-p',
        '0.0.0.0::5432',
        DOCKER_IMAGE,
      ],
      { env: dockerEnv(dockerCommand) },
    );

    const portOutput = await runCapture(dockerCommand, ['port', container, '5432/tcp'], {
      env: dockerEnv(dockerCommand),
    });
    const port = portOutput.trim().split(':').pop();
    if (!port) {
      throw new Error(`Could not resolve mapped Postgres port for ${container}.`);
    }

    await waitForContainer(dockerCommand, container);
    const host = await resolveHostReachableAddress(dockerCommand, port);

    return {
      container,
      databaseUrl: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${host}:${port}/${POSTGRES_DB}?sslmode=disable`,
      dockerDatabaseUrl: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${host}:${port}/${POSTGRES_DB}?sslmode=disable`,
    };
  } catch (error) {
    await stopContainer(dockerCommand, container);
    throw error;
  }
}

async function stopContainer(dockerCommand: string, container: string): Promise<void> {
  try {
    await run(dockerCommand, ['rm', '-f', container], { env: dockerEnv(dockerCommand) });
  } catch {
    // Cleanup is best effort. Docker may have already removed the container.
  }
}

async function stopEphemeralDb(dockerCommand: string, db: EphemeralDb): Promise<void> {
  await stopContainer(dockerCommand, db.container);
}

async function waitForContainer(dockerCommand: string, container: string): Promise<void> {
  const attempts = 30;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await run(dockerCommand, ['exec', container, 'pg_isready', '-U', POSTGRES_USER, '-d', POSTGRES_DB], {
        env: dockerEnv(dockerCommand),
      });
      return;
    } catch {
      if (attempt === attempts) {
        throw new Error(`Timed out waiting for ephemeral Postgres container ${container}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

function dbTarget(dockerCommand: string, db: EphemeralDb) {
  return {
    dbUrl: db.databaseUrl,
    genTypesDbUrl: db.dockerDatabaseUrl,
    env: dockerEnv(dockerCommand),
  };
}

async function applyEphemeralDbFoundation(dockerCommand: string, db: EphemeralDb): Promise<void> {
  await run(
    dockerCommand,
    ['cp', 'supabase/ci/mock_supabase_minimal.sql', `${db.container}:/tmp/mock_supabase_minimal.sql`],
    { env: dockerEnv(dockerCommand) },
  );
  await run(
    dockerCommand,
    [
      'exec',
      db.container,
      'psql',
      '-U',
      POSTGRES_USER,
      '-d',
      POSTGRES_DB,
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '/tmp/mock_supabase_minimal.sql',
    ],
    { env: dockerEnv(dockerCommand) },
  );

  await run('pnpm', ['db', 'migrate', 'up', '--db-url', db.databaseUrl, '--yes'], {
    displayArgs: ['db', 'migrate', 'up', '--db-url', '<redacted>', '--yes'],
  });
}

async function syncEphemeralRls(db: EphemeralDb): Promise<void> {
  await run('pnpm', ['rls', 'sync'], {
    env: {
      RLS_SYNC_MODE: 'db-url',
      DATABASE_URL: db.databaseUrl,
    },
  });
}

async function runDbGenerateFromDocker(dockerCommand: string): Promise<void> {
  const db = await startEphemeralDb(dockerCommand);
  try {
    const target = dbTarget(dockerCommand, db);
    await applyEphemeralDbFoundation(dockerCommand, db);
    await runDbTypes(target);
    await syncEphemeralRls(db);
    await runDbTypes(target);
  } finally {
    await stopEphemeralDb(dockerCommand, db);
  }
}

export async function runGenerate(options: GenerateOptions = {}): Promise<void> {
  const dockerCommand = await resolveDockerCommand();
  if (!dockerCommand) {
    throw new Error(dockerUnavailableMessage());
  }

  await runApiGenerate();
  await runDbGenerateFromDocker(dockerCommand);
  await stageGeneratedFiles(options);
}

async function stageGeneratedFiles(options: GenerateOptions): Promise<void> {
  if (options.skipGitAdd) {
    return;
  }

  const paths = [...API_GENERATED_PATHS, ...DB_GENERATED_PATHS];
  await run('git', ['add', ...paths]);
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate')
    .description('Regenerate API artifacts and deterministic DB artifacts from disposable Docker Postgres')
    .option('--skip-git-add', 'Do not stage generated artifacts after generation')
    .action(async (options: GenerateOptions) => {
      await runGenerate(options);
    });
}
