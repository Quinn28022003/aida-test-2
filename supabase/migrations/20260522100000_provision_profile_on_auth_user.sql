-- Auto-provision public.profiles when a Supabase Auth user is created or updated.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    ),
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data->>'avatar_url'), '')
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.update_profile_from_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    display_name = coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      display_name
    ),
    avatar_url = coalesce(
      nullif(trim(new.raw_user_meta_data->>'avatar_url'), ''),
      avatar_url
    ),
    email = coalesce(new.email, email),
    updated_at = now()
  where auth_user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (
    old.raw_user_meta_data is distinct from new.raw_user_meta_data
    or old.email is distinct from new.email
  )
  execute function public.update_profile_from_user();

-- Backfill profiles for auth users created before this migration.
insert into public.profiles (auth_user_id, display_name, email, avatar_url)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'User'
  ),
  coalesce(u.email, ''),
  nullif(trim(u.raw_user_meta_data->>'avatar_url'), '')
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.auth_user_id = u.id
);
