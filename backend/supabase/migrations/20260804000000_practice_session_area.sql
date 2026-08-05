-- Which part of the game a practice session was. (Slice C, C2.)
--
-- The contribution graph currently counts attendance: a square is a square, whether you
-- spent it on the range or on 6-footers. Slice D colours those squares by area, and to do
-- that a session has to know which area it was.
--
-- Why a stored column and not a join
-- ----------------------------------
-- There is no join available. `practice_sessions.program_step_id` exists on the model but
-- NOTHING in the codebase writes to it -- the column and one stale comment are its only
-- references -- so the path session -> program_step -> program -> issue.area is broken at
-- its first hop and always has been.
--
-- The remaining path, analysis_issue_id -> analysis_issues.issue_id -> issues.area, works
-- only for practice on an AI-analysed issue. Browse-started and custom issues have no
-- AnalysisIssue row at all, so every session started from the library would resolve to no
-- area -- which is precisely the short-game content Slice C exists to add. The whole short
-- game would be invisible on the graph the moment it was authored.
--
-- Second reason: issues.area is admin-editable. Joining would mean re-filing one issue
-- retroactively repaints a year of history. A session's area is a fact about a day that
-- already happened. (Deliberately the opposite of a drill run's `grade`, which IS
-- re-derived on every read -- a grade is a judgement and should track current thresholds.)
--
-- NULL is meaningful and permanent
-- --------------------------------
-- NULL means unattributed: free practice with no issue behind it, plus every session
-- created by an app build that shipped before this column existed. The graph renders those
-- as their own segment rather than dropping them -- a session the golfer actually did must
-- never vanish from the streak because the server could not label it.

ALTER TABLE public.practice_sessions
    ADD COLUMN IF NOT EXISTS area text
    REFERENCES public.taxonomy_areas(key) ON DELETE RESTRICT;

-- Every session that exists today predates the whole-game work, so it was full swing --
-- that is all the catalog contained. Done once, here, rather than left NULL: these are
-- real sessions and leaving them unattributed would put a grey band across the golfer's
-- entire history for no reason.
UPDATE public.practice_sessions SET area = 'FULL_SWING' WHERE area IS NULL;

-- The graph queries a user's sessions over a date window and groups by day and area.
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_completed
    ON public.practice_sessions (user_id, completed_at);

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in 20260730000000)
-- --------------------------------------------------------------------------------------
--   DROP INDEX IF EXISTS public.idx_practice_sessions_user_completed;
--   ALTER TABLE public.practice_sessions DROP COLUMN IF EXISTS area;
--
-- Purely additive: no existing column is rewritten, so dropping it loses only the
-- attribution added since this ran.
