import type { AppEnv } from './env.js';

/** Gate destructive production migrate commands; development never requires `--confirm`. */
export function requireProductionConfirm(
  env: AppEnv,
  confirm: string | undefined,
  action: string,
): void {
  if (env !== 'production') {
    return;
  }
  if (confirm !== 'production') {
    console.error(
      `Production ${action} requires --confirm production.`,
    );
    process.exit(1);
  }
}
