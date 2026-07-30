-- Revoke client write privileges on issue_goals and issue_misses.
--
-- Completes 20260730000000_content_rls.sql, which revoked writes on issues, drills
-- and issue_drill but not on these two. No migration ever granted them anything, so
-- they looked ungranted in the SQL; in fact Supabase's default privileges on the
-- public schema hand new tables full access for anon and authenticated, which these
-- picked up silently when they were created in 20260711000000.
--
-- RLS alone is not equivalent here. With the write privilege still held and no write
-- policy, DELETE and UPDATE are not refused — they match zero rows and report
-- success. Revoking makes them fail loudly (SQLSTATE 42501) like the other three
-- content tables.
--
-- Idempotent: safe to re-run.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.issue_goals  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.issue_misses FROM anon, authenticated;

-- Reads stay open; the SELECT policies from the previous migration still apply.
GRANT SELECT ON TABLE public.issue_goals  TO anon, authenticated;
GRANT SELECT ON TABLE public.issue_misses TO anon, authenticated;

-- ---------- rollback ----------
--
--   GRANT ALL ON TABLE public.issue_goals  TO anon, authenticated;
--   GRANT ALL ON TABLE public.issue_misses TO anon, authenticated;
