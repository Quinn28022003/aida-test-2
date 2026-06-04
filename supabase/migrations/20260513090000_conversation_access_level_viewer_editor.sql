-- AIDA-MVP-005 access_level simplification
--
-- Convert access_level from viewer/participant/moderator/owner to viewer/editor
-- on every table that uses the enum (conversation + job invitations).
--
-- Mapping:
--   viewer      -> viewer
--   participant -> editor
--   moderator   -> editor
--   owner       -> editor

alter table conversation_members alter column access_level drop default;
alter table conversation_invitations alter column access_level drop default;
alter table job_invitations alter column access_level drop default;

alter type access_level rename to access_level_old;

create type access_level as enum ('viewer', 'editor');

alter table conversation_members
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'editor'
    end
  )::access_level;

alter table conversation_invitations
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'editor'
    end
  )::access_level;

alter table job_invitations
  alter column access_level type access_level
  using (
    case access_level::text
      when 'viewer' then 'viewer'
      else 'editor'
    end
  )::access_level;

alter table conversation_members alter column access_level set default 'viewer';
alter table conversation_invitations alter column access_level set default 'viewer';
alter table job_invitations alter column access_level set default 'viewer';

drop type access_level_old;
