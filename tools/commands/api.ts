/**
 * API developer workflows.
 *
 * - `openapi`: generate OpenAPI spec from Hono route AppTypes via @rcmade/hono-docs.
 * - `client`: generate fetch SDK from OpenAPI via @hey-api/openapi-ts.
 * - `generate`: run openapi then client.
 * - `check`: run generate, then fail if OpenAPI or generated client drift from git.
 */
import { Command } from 'commander';

import { run } from '../lib/run.js';

const API_EXAMPLES = `
Examples:
  pnpm api openapi
  pnpm api client
  pnpm api generate
  pnpm api check
`;

const INTERNAL_OPENAPI_JSON = 'apps/api-gateway/openapi/internal.openapi.json';
const PUBLIC_OPENAPI_JSON = 'apps/api-gateway/openapi/public.openapi.json';
const GENERATED_CLIENT = 'packages/api-client/src/generated';

export async function runApiOpenapi(): Promise<void> {
  await run('pnpm', ['exec', 'hono-docs', 'generate', '--config', 'apps/api-gateway/hono-docs.internal.ts']);
  await run('pnpm', ['exec', 'hono-docs', 'generate', '--config', 'apps/api-gateway/hono-docs.public.ts']);
}

export async function runApiClient(): Promise<void> {
  await run('pnpm', ['exec', 'openapi-ts', '--file', 'openapi-ts.config.mjs']);
}

export async function runApiGenerate(): Promise<void> {
  await runApiOpenapi();
  await runApiClient();
}

export async function runApiCheck(): Promise<void> {
  await runApiGenerate();
  await run('git', [
    'diff',
    '--exit-code',
    INTERNAL_OPENAPI_JSON,
    PUBLIC_OPENAPI_JSON,
    GENERATED_CLIENT,
  ]);
}

export function registerApiCommand(program: Command): void {
  const api = program
    .command('api')
    .description('OpenAPI spec and API client SDK generation')
    .addHelpText('after', API_EXAMPLES)
    .action(() => {
      api.outputHelp();
      process.exit(0);
    });

  api.command('openapi')
    .description('Generate internal/public OpenAPI JSON files from Hono route AppTypes')
    .action(async () => {
      await runApiOpenapi();
    });

  api.command('client')
    .description('Generate packages/api-client/src/generated from OpenAPI')
    .action(async () => {
      await runApiClient();
    });

  api.command('generate')
    .description('Regenerate OpenAPI spec and API client SDK')
    .action(async () => {
      await runApiGenerate();
    });

  api.command('check')
    .description('Regenerate OpenAPI + client and fail if git diff is non-empty')
    .action(async () => {
      await runApiCheck();
    });
}
