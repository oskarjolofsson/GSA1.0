-- Add reviewed_at to analysis, for the review-summary screen (parallel work) to stamp.
--
-- Nullable, no default, no backfill: existing rows simply have no review yet, and nothing
-- reads or writes this column until the review-screen and read/write follow-up land.

ALTER TABLE public.analysis
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in prior migrations)
-- --------------------------------------------------------------------------------------
--   ALTER TABLE public.analysis DROP COLUMN IF EXISTS reviewed_at;
--
-- Purely additive: no existing column is touched, so dropping it loses nothing but the
-- review timestamps recorded since this ran.
