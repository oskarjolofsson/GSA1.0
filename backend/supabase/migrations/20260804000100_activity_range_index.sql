-- Index for the bounded activity query (Slice C, C3).
--
-- `/activity/` now takes from_date/to_date and groups by day and area. The practice half
-- is already covered -- 20260804000000 added (user_id, completed_at) -- but the analysis
-- half filters the same shape on `created_at` and had nothing: `analysis` carried only
-- idx_analysis_video_id, so counting a user's analyses over a date window meant a scan.
--
-- Both halves of one query, so both get an index.

CREATE INDEX IF NOT EXISTS idx_analysis_user_created
    ON public.analysis (user_id, created_at);

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in 20260730000000)
-- --------------------------------------------------------------------------------------
--   DROP INDEX IF EXISTS public.idx_analysis_user_created;
