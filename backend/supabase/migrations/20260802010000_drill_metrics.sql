-- Scoreable drills (Slice B).
--
-- Full swing needs a camera and an AI to say anything useful. Ten 6-footers just needs
-- counting. Today every drill ends the same way -- the golfer taps rough/ok/dialed and
-- blockFeel.ts stuffs that ordinal into `successful_reps`, a column named for something
-- else entirely. Short game deserves a number you can beat, and that number should drive
-- what gets scheduled next rather than just decorating a chart.
--
-- Five columns, all additive and all nullable. Nothing is backfilled and nothing is
-- rewritten: a drill with no metric stays feel-only, which is every drill that exists
-- today.

-- --------------------------------------------------------------------------------------
-- drills
-- --------------------------------------------------------------------------------------

-- Which part of the game this drill belongs to. NULL means "any" -- a mirror drill or a
-- tempo drill is not about a place on the course. The FK is to the taxonomy table Slice A
-- created, so an area cannot be invented here by typo.
ALTER TABLE public.drills
    ADD COLUMN IF NOT EXISTS area text
    REFERENCES public.taxonomy_areas(key) ON DELETE RESTRICT;

-- How this drill is scored. NULL = feel-only (rough/ok/dialed), which is the pre-existing
-- behaviour and stays the fallback forever.
--
-- JSONB rather than columns, mirroring program_steps.prescription: the shape differs per
-- type (proximity carries a unit and lower_is_better; make_rate does not), and metric
-- types are expected to grow. Validated in core/services/drill_metrics.py -- Postgres
-- checks only that it is an object, because a CHECK constraint here would be a fifth
-- hand-synced copy of the rules, which is the exact trap Slice A just dug us out of.
--
--   {"type":"make_rate",   "reps":10, "label":"6-foot putts made",
--    "grade_at":{"dialed":0.8,"ok":0.5}}
--   {"type":"proximity",   "reps":10, "unit":"ft", "label":"Avg distance to hole",
--    "grade_at":{"dialed":0.8,"ok":0.5}, "lower_is_better":true}
--   {"type":"up_and_down", "reps":10, "grade_at":{"dialed":0.8,"ok":0.5}}
--
-- grade_at holds proportions, not counts, so one authored threshold scales to any rep
-- count: on a 10-rep drill 8-10 is dialed, 5-7 ok, under 5 rough.
ALTER TABLE public.drills
    ADD COLUMN IF NOT EXISTS metric jsonb;

ALTER TABLE public.drills
    DROP CONSTRAINT IF EXISTS drills_metric_is_object;
ALTER TABLE public.drills
    ADD CONSTRAINT drills_metric_is_object
    CHECK (metric IS NULL OR jsonb_typeof(metric) = 'object');

CREATE INDEX IF NOT EXISTS idx_drills_area ON public.drills (area);

-- --------------------------------------------------------------------------------------
-- practice_drill_runs
-- --------------------------------------------------------------------------------------

-- What the golfer actually scored. Raw, ungraded, in the metric's own units: 8 putts made,
-- or 4.2 feet average.
--
-- The grade is not stored. The server derives it from the drill's grade_at when the value
-- arrives, applies the strength delta, and re-derives on read for display. Storing the raw
-- number is what lets a retuned threshold change how history *reads*; it does not rewind
-- strength, which was already banked at the time and is a running total, not a projection.
ALTER TABLE public.practice_drill_runs
    ADD COLUMN IF NOT EXISTS metric_value numeric;

-- Which metric produced that number. Denormalised from drills.metric->>'type' on purpose:
-- a drill retuned from make_rate to proximity would otherwise silently reinterpret every
-- run before the change, turning "8 made" into "8 feet away".
ALTER TABLE public.practice_drill_runs
    ADD COLUMN IF NOT EXISTS metric_type text;

-- The block feel, finally in a column named after itself. 1=rough, 2=ok, 3=dialed,
-- NULL=not rated.
--
-- successful_reps has carried this ordinal since blockFeel.ts shipped ("Phase 1 stores
-- this in the existing successful_reps column ... to avoid a migration"). That column is
-- on five API schemas and old builds read it, so it is frozen rather than dropped; new
-- writes land here.
ALTER TABLE public.practice_drill_runs
    ADD COLUMN IF NOT EXISTS feel smallint;

ALTER TABLE public.practice_drill_runs
    DROP CONSTRAINT IF EXISTS practice_drill_runs_feel_range;
ALTER TABLE public.practice_drill_runs
    ADD CONSTRAINT practice_drill_runs_feel_range
    CHECK (feel IS NULL OR feel BETWEEN 1 AND 3);

-- Backfill the feel column from the ordinals successful_reps has been carrying. Values
-- outside 1..3 are not feels -- they are either "no rating" (0) or genuine rep counts from
-- before blockFeel.ts -- and stay NULL.
UPDATE public.practice_drill_runs
   SET feel = successful_reps
 WHERE feel IS NULL
   AND successful_reps BETWEEN 1 AND 3;

-- --------------------------------------------------------------------------------------
-- drill_id FK repair
-- --------------------------------------------------------------------------------------
--
-- PracticeDrillRun.py:30 declares ondelete="SET NULL" on a NOT NULL column. Two separate
-- things were wrong, and fixing either alone still leaves the delete broken:
--
--   1. the column was NOT NULL, so SET NULL could not fire even if it wanted to
--   2. the *database* constraint was never SET NULL at all -- ondelete= is SQLAlchemy
--      metadata used when SQLAlchemy emits the DDL, and this table's DDL came from a
--      migration that omitted it. Postgres has been enforcing NO ACTION the whole time.
--
-- So deleting a practised drill has always been refused outright. Honour the original
-- intent: the run survives its drill, keeping the session in the streak and the graph,
-- and simply loses its title.

ALTER TABLE public.practice_drill_runs
    ALTER COLUMN drill_id DROP NOT NULL;

ALTER TABLE public.practice_drill_runs
    DROP CONSTRAINT IF EXISTS practice_drill_runs_drill_id_fkey;
ALTER TABLE public.practice_drill_runs
    ADD CONSTRAINT practice_drill_runs_drill_id_fkey
    FOREIGN KEY (drill_id) REFERENCES public.drills(id) ON DELETE SET NULL;

-- Rollback (Supabase has no down-migrations; hand-written as in 20260730000000):
--   ALTER TABLE public.practice_drill_runs
--     DROP CONSTRAINT IF EXISTS practice_drill_runs_drill_id_fkey;
--   ALTER TABLE public.practice_drill_runs
--     ADD CONSTRAINT practice_drill_runs_drill_id_fkey
--     FOREIGN KEY (drill_id) REFERENCES public.drills(id);
--   ALTER TABLE public.practice_drill_runs ALTER COLUMN drill_id SET NOT NULL;  -- fails if any run was orphaned
--   ALTER TABLE public.practice_drill_runs
--     DROP CONSTRAINT IF EXISTS practice_drill_runs_feel_range,
--     DROP COLUMN IF EXISTS feel,
--     DROP COLUMN IF EXISTS metric_type,
--     DROP COLUMN IF EXISTS metric_value;
--   DROP INDEX IF EXISTS public.idx_drills_area;
--   ALTER TABLE public.drills
--     DROP CONSTRAINT IF EXISTS drills_metric_is_object,
--     DROP COLUMN IF EXISTS metric,
--     DROP COLUMN IF EXISTS area;
