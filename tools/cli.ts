/**
 * AIDA monorepo developer CLI (invoked via root package.json: `pnpm db`, `pnpm rls`, etc.).
 *
 * - `tools/cli.ts` only registers command groups; behaviour lives in `tools/commands/*`.
 * - pnpm appends extra args: `pnpm db types` → `tsx tools/cli.ts db types`.
 * - Top-level help: use `pnpm run help` (pnpm reserves `pnpm help` for its own CLI).
 *
 * See docs/adrs/0006-internal-database-cli.md for flows and rationale.
 */
import { Command } from 'commander';

import { registerApiCommand } from './commands/api.js';
import { registerDbCommand } from './commands/db.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerRlsCommand } from './commands/rls.js';
import { registerTestCommand } from './commands/test.js';

const program = new Command();

program
  .name('aida')
  .description('AIDA monorepo developer CLI')
  .version('1.0.0')
  .showHelpAfterError()
  .showSuggestionAfterError();

registerDbCommand(program);
registerRlsCommand(program);
registerApiCommand(program);
registerGenerateCommand(program);
registerTestCommand(program);

program
  .command('help')
  .description('Show full CLI help')
  .action(() => {
    program.outputHelp();
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error && error.message) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

void main();
