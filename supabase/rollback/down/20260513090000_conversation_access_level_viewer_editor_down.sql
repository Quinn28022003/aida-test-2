-- AIDA-MVP-005 conversation access-level simplification rollback (local only)
--
-- Use only against a local or disposable Supabase database. Production rollback
-- is forward-fix only.
--
-- Revert access_level from viewer/editor back to the original
-- viewer/participant/moderator/owner enum.
--
-- The up migration collapsed participant/moderator/owner into editor, so this
-- rollback cannot recover the original precise value. It maps:
--   viewer -> viewer
--   editor -> participant

alter table conversation_members alter column access_level drop default;
alter table conversation_invitations alter column access_level drop default;
alter table job_invitations alter column access_level drop default;

alter type access_level rename to access_level_new;

create type access_level as enum ('viewer', 'participant', 'moderator', 'owner');

alter table conversation_members
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'participant'
    end
  )::access_level;

alter table conversation_invitations
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'participant'
    end
  )::access_level;

alter table job_invitations
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'participant'
    end
  )::access_level;

alter table conversation_members alter column access_level set default 'participant';
alter table conversation_invitations alter column access_level set default 'participant';
alter table job_invitations alter column access_level set default 'participant';

drop type access_level_new;
