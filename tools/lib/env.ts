/** CLI `--env` flag only; does not select which Supabase project runs (that is `supabase link`). */
export type AppEnv = 'development' | 'production';

const VALID_ENVS = new Set<AppEnv>(['development', 'production']);

export function parseEnv(value: string | undefined): AppEnv {
  const env = value ?? 'development';
  if (!VALID_ENVS.has(env as AppEnv)) {
    console.error(`Unknown --env "${env}". Use development or production.`);
    process.exit(1);
  }
  return env as AppEnv;
}

export function nodeEnvFor(env: AppEnv): 'development' | 'production' {
  return env === 'production' ? 'production' : 'development';
}

/** Passed to child processes (e.g. Supabase CLI) that may read NODE_ENV elsewhere in the repo. */
export function envVarsFor(env: AppEnv): Record<string, string> {
  return { NODE_ENV: nodeEnvFor(env) };
}

export function printResolvedEnv(env: AppEnv): void {
  console.log(`Environment: ${env} (NODE_ENV=${nodeEnvFor(env)})`);
}
