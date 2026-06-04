drop trigger if exists on_auth_user_updated on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.update_profile_from_user();
drop function if exists public.handle_new_user();
