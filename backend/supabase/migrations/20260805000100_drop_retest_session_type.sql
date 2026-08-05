-- Retire the 'retest' session type. (PR2.)
--
-- 'retest' was a checkpoint step the program engine used to schedule: practise for a
-- while, then re-test the fault to see whether it had moved. The engine stopped
-- scheduling it some time ago -- the program now ends by grooving every drill rather than
-- by passing a checkpoint -- but the value stayed legal in both CHECK constraints so
-- historical rows kept validating. A model comment and a test were left behind
-- specifically to stop anyone removing it.
--
-- Removing it deliberately now. Keeping a permanently-unwritten enum value costs a line
-- of explanation in three places forever, and every reader has to work out whether it is
-- live. Backfilling the handful of historical rows to 'range' loses nothing anyone can
-- see: a retest was a practice session, it already earned its contribution square, and
-- nothing in the product distinguishes the two after the fact.
--
-- Deliberately NOT in this migration: renaming 'range' to 'practice'. The shipped app
-- both writes that value (features/practice/services/sessionService.ts) and branches on
-- it (features/home/homeFlow.tsx), so narrowing it would stop old builds from starting a
-- practice session at all. That rename ships with the app changes that make it visible to
-- the golfer -- a putting program should not say "Range * 2 drills" -- rather than being
-- smuggled in behind a compatibility alias here.

-- --------------------------------------------------------------------------------------
-- 1. Backfill before narrowing, or the constraint swap fails on existing rows
-- --------------------------------------------------------------------------------------

UPDATE public.program_steps     SET session_type = 'range' WHERE session_type = 'retest';
UPDATE public.practice_sessions SET session_type = 'range' WHERE session_type = 'retest';

-- --------------------------------------------------------------------------------------
-- 2. program_steps: 'range' is the only type the engine schedules
--
-- 'play' went in 20260805000000 (playing a round serves every open program at once, so it
-- was never a step inside one) and its rows were deleted there, so nothing is left to
-- permit besides practice.
-- --------------------------------------------------------------------------------------

ALTER TABLE public.program_steps
    DROP CONSTRAINT IF EXISTS program_steps_session_type_check;
ALTER TABLE public.program_steps
    ADD CONSTRAINT program_steps_session_type_check
    CHECK (session_type = 'range');

-- --------------------------------------------------------------------------------------
-- 3. practice_sessions: 'play' STAYS -- it is the round
--
-- A round is a practice_sessions row with session_type = 'play'. It carries the golfer's
-- notes and earns a contribution square, and it is the only record that a round happened
-- now that program_steps no longer tracks one.
-- --------------------------------------------------------------------------------------

ALTER TABLE public.practice_sessions
    DROP CONSTRAINT IF EXISTS practice_sessions_session_type_check;
ALTER TABLE public.practice_sessions
    ADD CONSTRAINT practice_sessions_session_type_check
    CHECK (session_type IN ('range', 'play'));

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in 20260804000000)
-- --------------------------------------------------------------------------------------
--   ALTER TABLE public.practice_sessions
--       DROP CONSTRAINT IF EXISTS practice_sessions_session_type_check;
--   ALTER TABLE public.practice_sessions
--       ADD CONSTRAINT practice_sessions_session_type_check
--       CHECK (session_type IN ('range','play','retest'));
--   ALTER TABLE public.program_steps
--       DROP CONSTRAINT IF EXISTS program_steps_session_type_check;
--   ALTER TABLE public.program_steps
--       ADD CONSTRAINT program_steps_session_type_check
--       CHECK (session_type IN ('range','play','retest'));
--
-- Widening the constraints back is safe and complete. The backfill in step 1 is not
-- reversible -- rows that used to read 'retest' now read 'range' and there is no record of
-- which ones they were. Nothing in the product reads the distinction, but if that history
-- matters to you, capture it before running this:
--   SELECT id FROM practice_sessions WHERE session_type = 'retest';
