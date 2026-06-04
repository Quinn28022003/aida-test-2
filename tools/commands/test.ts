/**
 * Root test workflows.
 *
 * `pnpm test` keeps the existing full Turbo-cached workspace test behaviour.
 * Extra modes live under the same root entry point: `pnpm test watch` / `coverage`.
 */
import { Command } from 'commander';

import { mergeWorkspaceCoverageReports } from '../lib/coverage.js';
import { run } from '../lib/run.js';

const TEST_EXAMPLES = `
Examples:
  pnpm test
  pnpm test watch
  pnpm test coverage
  pnpm test help
`;

export async function runWorkspaceTests(): Promise<void> {
  await run('turbo', ['run', 'test']);
}

export async function runTestWatch(): Promise<void> {
  await run('vitest', ['--workspace', 'vitest.workspace.ts']);
}

export async function runTestCoverage(): Promise<void> {
  await run('turbo', ['run', 'test:coverage']);
  await mergeWorkspaceCoverageReports();
}

export function registerTestCommand(program: Command): void {
  const test = program
    .command('test')
    .description('Workspace test commands')
    .argument('[args...]', 'Use subcommands; accepts --help after pnpm --')
    .addHelpText('after', TEST_EXAMPLES)
    // No subcommand -> preserve the old root `pnpm test` behaviour.
    .action(async (args: string[] = []) => {
      if (args.includes('--help') || args.includes('-h')) {
        test.outputHelp();
        return;
      }
      if (args.length > 0) {
        console.error(
          `Unknown test arguments: ${args.join(' ')}. Use "pnpm test help" for available commands.`,
        );
        process.exit(1);
      }
      await runWorkspaceTests();
    });

  test
    .command('watch')
    .description('Run Vitest in workspace watch mode')
    .action(async () => {
      await runTestWatch();
    });

  test
    .command('coverage')
    .description('Run Vitest workspace coverage report')
    .action(async () => {
      await runTestCoverage();
    });

  test
    .command('help')
    .description('Show test command help')
    .action(() => {
      test.outputHelp();
    });
}
