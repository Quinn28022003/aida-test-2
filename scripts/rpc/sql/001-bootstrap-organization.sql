-- Upgrade policy: drop every existing overload, then CREATE fresh (never CREATE OR REPLACE).
-- When changing signature or return type, edit CREATE FUNCTION + GRANT below only — the drop block
-- removes all prior public.bootstrap_organization overloads automatically.

do $$
declare
  r record;
begin
  for r in
    select pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'bootstrap_organization'
  loop
    execute format(
      'drop function if exists public.bootstrap_organization(%s) cascade',
      r.args
    );
  end loop;
end $$;

create function public.bootstrap_organization(
  p_name text,
  p_slug text,
  p_data_region text default 'default',
  p_default_locale text default 'en-AU'
)
returns public.organizations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor_profile_id uuid;
  v_org public.organizations;
  v_owner_role_id uuid;
begin
  v_actor_profile_id := current_profile_id();

  if v_actor_profile_id is null then
    raise exception 'Authenticated profile is required for organization bootstrap';
  end if;

  insert into public.organizations (name, slug, data_region, default_locale, created_by)
  values (p_name, p_slug, p_data_region, p_default_locale, v_actor_profile_id)
  returning * into v_org;

  select r.id
  into v_owner_role_id
  from public.roles r
  where r.org_id is null
    and r.key = 'owner'
  limit 1;

  if v_owner_role_id is null then
    raise exception 'Global owner role is missing';
  end if;

  insert into public.member_roles (org_id, user_id, role_id, assigned_by)
  values (v_org.id, v_actor_profile_id, v_owner_role_id, v_actor_profile_id);

  insert into public.organization_members (org_id, user_id, member_type, status)
  values (v_org.id, v_actor_profile_id, 'internal', 'active');

  return v_org;
end;
$$;

grant execute on function public.bootstrap_organization(text, text, text, text) to authenticated;
