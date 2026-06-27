-- Migration: practice_session_notes
-- Purpose: Let a practice session carry free-text notes (used by on-course "play"
-- sessions where the golfer jots how the round went). `session_type` already
-- exists from the programs migration.

BEGIN;

ALTER TABLE public.practice_sessions
  ADD COLUMN notes text;

COMMIT;
