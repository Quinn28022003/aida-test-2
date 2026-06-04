-- Minimal Supabase-shaped stubs for CI against plain Postgres (see .github/workflows/ci.yml).
-- Do not run against production. Extend when migrations reference more auth/storage APIs.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role bypassrls;
  end if;
end;
$$;

create schema if not exists auth;

-- Real auth.users has many more columns; app migrations here only need a stable id for FKs.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table auth.users
  add column if not exists raw_user_meta_data jsonb default '{}'::jsonb;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    current_user
  );
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'sub', nullif(current_setting('request.jwt.claim.sub', true), ''),
    'role', coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user)
  );
$$;

-- Stub storage schema so future migrations referencing storage.* do not fail in CI.
create schema if not exists storage;

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  metadata jsonb,
  path_tokens text[],
  version text,
  owner_id text,
  deleted_at timestamptz
);

-- Role for RLS integration tests: the postgres superuser always bypasses RLS (BYPASSRLS),
-- so `scripts/rls/test/run-tests.mjs` must connect as a normal role and `SET LOCAL ROLE authenticated`.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'rls_ci') then
    create role rls_ci with login password 'rls_ci' nosuperuser nobypassrls noinherit;
  else
    alter role rls_ci with login password 'rls_ci' nosuperuser nobypassrls noinherit;
  end if;

  execute format('grant connect on database %I to rls_ci', current_database());
end;
$$;

grant usage on schema public to rls_ci;
grant usage on schema auth to rls_ci;
grant authenticated to rls_ci;
