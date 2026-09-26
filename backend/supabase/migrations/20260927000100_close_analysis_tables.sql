-- Close analysis, analysis_issues and videos to client roles.
--
-- They still carried what the original schema dump (20260705081615) gave them: full
-- grants for anon and authenticated, and owner-scoped policies for INSERT / UPDATE /
-- DELETE on analysis and videos. So a signed-in user holding the anon key that ships in
-- the app could bypass the backend and rewrite their own rows through PostgREST:
--
--   analysis   set status = 'completed', success, or any law, on their own analyses
--   videos     repoint video_key / thumbnail_key; GET /analyses/{id}/video-url/ signs
--              whatever key the row holds
--
-- Nothing needs this access. The mobile app and the admin dashboard use Supabase for auth
-- only (no .from() / .rpc() calls), and the backend connects as the `postgres` owner,
-- which bypasses RLS. So these get the same treatment as the tables in
-- 20260730020000_close_remaining_tables.sql: every client privilege revoked, RLS on, and
-- no policy — the owner policies are dropped too, so a later GRANT alone exposes nothing.
--
-- Idempotent: safe to re-run.

-- ---------- revoke every client privilege ----------
-- service_role and the postgres owner are untouched.

REVOKE ALL ON TABLE public.analysis        FROM anon, authenticated;
REVOKE ALL ON TABLE public.analysis_issues FROM anon, authenticated;
REVOKE ALL ON TABLE public.videos          FROM anon, authenticated;

-- ---------- RLS on, deliberately no policies ----------

ALTER TABLE public.analysis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analysis_owner_select         ON public.analysis;
DROP POLICY IF EXISTS analysis_owner_insert         ON public.analysis;
DROP POLICY IF EXISTS analysis_owner_update         ON public.analysis;
DROP POLICY IF EXISTS analysis_owner_delete         ON public.analysis;
DROP POLICY IF EXISTS analysis_issues_owner_select  ON public.analysis_issues;
DROP POLICY IF EXISTS videos_owner_select           ON public.videos;
DROP POLICY IF EXISTS videos_owner_insert           ON public.videos;
DROP POLICY IF EXISTS videos_owner_update           ON public.videos;
DROP POLICY IF EXISTS videos_owner_delete           ON public.videos;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism; this is the manual undo. It restores
-- the grants the schema dump gave; the dropped owner policies are in
-- 20260705081615_remote_schema.sql and would have to be re-created from there.
--
--   GRANT ALL ON TABLE public.analysis TO anon, authenticated;
--   GRANT ALL ON TABLE public.videos   TO anon, authenticated;
--   GRANT ALL ON TABLE public.analysis_issues TO anon;
--   GRANT SELECT, REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.analysis_issues TO authenticated;
