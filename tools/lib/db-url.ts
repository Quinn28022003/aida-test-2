const POSTGRES_URL_PREFIXES = ['postgres://', 'postgresql://'] as const;

/** Fail fast when a URL is not a Postgres connection string (e.g. Supabase HTTPS app URL). */
export function assertPostgresUrl(url: string, label = '--db-url'): string {
  if (!POSTGRES_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    console.error(
      `${label} must be a Postgres connection string (postgres:// or postgresql://).`,
    );
    process.exit(1);
  }
  return url;
}

/** Match `scripts/rls/sync-rls-sql.mjs` behaviour for local/ephemeral Postgres without SSL. */
export function mergeEnvForPostgresUrl(
  base: Record<string, string>,
  dbUrl: string,
): Record<string, string> {
  const env = { ...base };
  if (dbUrl.includes('sslmode=disable')) {
    env.PGSSLMODE = 'disable';
  }
  return env;
}
