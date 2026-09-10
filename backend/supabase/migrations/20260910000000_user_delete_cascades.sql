-- Deleting an account must not be blocked by, or silently orphan, the rows that
-- belong to it. Every user-scoped table already cascaded off auth.users except
-- three:
--
--   programs.user_id  had a foreign key with no ON DELETE action, so deleting any
--                     user who had ever started a program failed inside GoTrue
--                     with "Database error deleting user" — the auth row survived
--                     while the admin panel reported a generic failure.
--   issues.user_id    had no foreign key at all, so user-authored issues and
--   drills.user_id    drills outlived their author as unreachable rows.
--
-- user_id IS NULL on issues/drills means "admin-curated global catalog", so the
-- orphan rows are DELETEd rather than nulled: nulling would publish a deleted
-- user's private content into the catalog everyone sees.

begin;

-- Orphans first: the new constraints are validated against existing rows.
delete from public.issues
 where user_id is not null
   and user_id not in (select id from auth.users);

delete from public.drills
 where user_id is not null
   and user_id not in (select id from auth.users);

delete from public.programs
 where user_id not in (select id from auth.users);

alter table public.programs
  drop constraint if exists programs_user_id_fkey;

alter table public.programs
  add constraint programs_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.issues
  drop constraint if exists issues_user_id_fkey;

alter table public.issues
  add constraint issues_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.drills
  drop constraint if exists drills_user_id_fkey;

alter table public.drills
  add constraint drills_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

commit;
