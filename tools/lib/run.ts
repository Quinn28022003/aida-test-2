/**
 * Small subprocess helper for repo CLI flows such as `pnpm db prepare`.
 *
 * This is not a replacement for `pnpm run`; it keeps multi-step CLI flows fail-fast,
 * rooted at the repo, and easy to follow by printing each child command first.
 * Use `runCapture` only when a step needs stdout as data (for example generated types).
 */
import { spawn } from 'node:child_process';

import { repoRoot } from './paths.js';

type RunOptions = {
  /** Merged on top of `process.env` (e.g. NODE_ENV from `envVarsFor`). */
  env?: Record<string, string>;
  cwd?: string;
  /** Args shown in logs/errors when real args contain secrets such as database URLs. */
  displayArgs?: string[];
};

function spawnOptions(options: RunOptions = {}) {
  return {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...options.env },
  };
}

function exitError(command: string, args: string[], code: number | null): Error {
  const printed = [command, ...args].join(' ');
  return new Error(`Command failed (${code ?? 'signal'}): ${printed}`);
}

function waitForClose(child: ReturnType<typeof spawn>, command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(exitError(command, args, code));
    });
  });
}

export async function run(command: string, args: string[], options: RunOptions = {}): Promise<void> {
  const printed = [command, ...(options.displayArgs ?? args)].join(' ');
  console.log(`$ ${printed}`);
  const child = spawn(command, args, {
    ...spawnOptions(options),
    stdio: 'inherit',
  });
  await waitForClose(child, command, options.displayArgs ?? args);
}

/** Spawn a subprocess and return stdout as a string (stderr inherited). */
export async function runCapture(command: string, args: string[], options: RunOptions = {}): Promise<string> {
  const child = spawn(command, args, {
    ...spawnOptions(options),
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const stdout = child.stdout;
  if (!stdout) {
    throw new Error(`Failed to capture stdout: ${command}`);
  }
  const chunks: Buffer[] = [];
  stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
  await waitForClose(child, command, options.displayArgs ?? args);
  return Buffer.concat(chunks).toString('utf8');
}

const SUPABASE_READ_ATTEMPTS = 3;
const SUPABASE_READ_BACKOFF_MS = [2_000, 5_000, 10_000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Like `runCapture`, but retries transient Supabase read/introspection failures.
 * Use only for non-mutating CLI calls (e.g. gen types, db query).
 */
export async function runCaptureWithRetry(command: string, args: string[], options: RunOptions = {}): Promise<string> {
  const printed = [command, ...(options.displayArgs ?? args)].join(' ');
  let lastError: unknown;
  for (let attempt = 1; attempt <= SUPABASE_READ_ATTEMPTS; attempt++) {
    try {
      return await runCapture(command, args, options);
    } catch (error) {
      lastError = error;
      if (attempt >= SUPABASE_READ_ATTEMPTS) {
        break;
      }
      const delayMs = SUPABASE_READ_BACKOFF_MS[attempt - 1]!;
      console.warn(
        `$ ${printed} failed (attempt ${attempt}/${SUPABASE_READ_ATTEMPTS}); retrying in ${delayMs / 1000}s`,
      );
      await sleep(delayMs);
    }
  }
  throw lastError ?? new Error(`Command failed after ${SUPABASE_READ_ATTEMPTS} attempts: ${printed}`);
}
