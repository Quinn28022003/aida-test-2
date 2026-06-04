-- Purpose: list every column in the linked Supabase `public` schema with its real Postgres type.
--
-- Used by `pnpm db types` / `pnpm db schemas` via `supabase db query --linked` (see tools/commands/db.ts).
-- Rows are parsed into a `table.column` → type map (fetch-schema-column-types.mjs) so generated Zod
-- schemas use z.uuid() and z.iso.datetime() where Postgres has uuid / timestamptz, and z.string()
-- for text (e.g. request_id) — aligned with the live database, not migration SQL or column names.
--
-- Requires: migrations applied on the linked project; same database as `supabase gen types --linked`.

select
  table_name,
  column_name,
  udt_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position
