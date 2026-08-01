-- Seed the role reference data that public.handle_new_user_role() requires.
--
-- That function is a trigger on auth.users (see 20260705081615_remote_schema.sql:1273):
--
--     select id into default_role_id from roles where name = 'user';
--     insert into user_roles (user_id, role_id) values (new.id, default_role_id);
--
-- user_roles.role_id is NOT NULL, so against an empty roles table default_role_id comes
-- back NULL, the insert raises, the trigger aborts the INSERT into auth.users, and GoTrue
-- answers every signup with:
--
--     AuthApiError: Database error creating new user   (HTTP 500)
--
-- These two rows existed only in the remote database — no migration created them. So any
-- database built from this repo (a fresh `supabase db reset`, a new environment, CI) came
-- up in a state where nobody could register, including the test suite's fixture user.
--
-- This is bootstrap data rather than content: the schema does not function without it,
-- which is why it belongs in a migration and the catalog issues deliberately do not.
--
-- The UUIDs match the remote rows so both databases agree. Nothing resolves a role by id
-- (user_service.is_admin goes through user_has_role(user_id, "admin")), so this is for
-- consistency, not correctness.
--
-- Idempotent: ON CONFLICT (name) — roles_name_key is UNIQUE — so it is a no-op against
-- the remote database, where both rows already exist.

INSERT INTO public.roles (id, name, description) VALUES
  ('d8f6a18e-4f4d-4a6e-80dc-38453aa429df', 'user',  'Default role assigned to all regular users'),
  ('186b48ae-8efa-46a5-ab21-5cd66eae2910', 'admin', 'System administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo. Note that
-- user_roles.role_id references roles(id) ON DELETE CASCADE, so removing these rows also
-- strips every user's role assignment.
--
--   DELETE FROM public.roles WHERE name IN ('user', 'admin');
