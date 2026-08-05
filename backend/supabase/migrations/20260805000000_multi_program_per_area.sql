-- Many programs open at once, capped at two per area of the game. (PR1.)
--
-- Until now a golfer could hold exactly one active program. That was enforced by a single
-- Python `if` in program_service._seed_program -- no constraint, no unique index, no row
-- lock -- so it was advisory at best and racy in practice. It also stopped making sense
-- the moment the area taxonomy shipped: putting and chipping are different work, and
-- there is no reason grooving one should block the other.
--
-- Why a stored `area` column and not a join through issues
-- -------------------------------------------------------
-- The cap has to be a real database constraint, and a partial unique index cannot reach
-- through a foreign key. `programs.area` exists so Postgres can index it. That is the
-- whole reason.
--
-- It is stamped at creation and never updated afterwards, deliberately -- the same call
-- made for practice_sessions.area in 20260804000000 and for the same reason: issues.area
-- is admin-editable, and a program is a commitment the golfer made to a specific piece of
-- work. If an admin re-files "fat chips" from CHIPPING to PITCHING next month, a golfer
-- already three weeks into that program should not silently have it re-labelled, nor be
-- blocked from starting pitching work because of a row they opened under a different name.
-- The drift is cosmetic and self-heals: the program completes, the slot frees.
--
-- Why a `slot` column instead of counting rows
-- -------------------------------------------
-- "At most two active per area" is not directly expressible as a unique index. Counting in
-- application code before inserting is exactly the read-then-write race the old guard had.
-- A slot number (0 or 1) turns the cap into an ordinary uniqueness question that Postgres
-- answers atomically: UNIQUE (user_id, area, slot) WHERE status = 'active'. Two slots, two
-- programs, no trigger, no advisory lock, no lost update.
--
-- Why `play` steps are deleted
-- ----------------------------
-- program_steps carried a repeating range/range/play cycle, so every third step told the
-- golfer to go play a round. That was tolerable with one program and absurd with several:
-- five programs meant five simultaneous "go play 9 holes" prompts for what is one activity
-- that serves every focus at once. Playing is not a step inside one program.
--
-- The round already exists elsewhere and always has: a practice_sessions row with
-- session_type = 'play', which carries notes and earns a contribution square. Nothing is
-- lost by deleting these rows -- the actual record of rounds played lives in
-- practice_sessions, and these were duplicate bookkeeping.
--
-- The session_type CHECK constraints are NOT narrowed here. That is PR2, together with the
-- 'range' -> 'practice' rename, so this migration stays a data + constraint change and not
-- also a vocabulary change.

-- --------------------------------------------------------------------------------------
-- 1. area, backfilled from the issue it was seeded from
-- --------------------------------------------------------------------------------------

ALTER TABLE public.programs
    ADD COLUMN IF NOT EXISTS area text
    REFERENCES public.taxonomy_areas(key) ON DELETE RESTRICT;

UPDATE public.programs p
   SET area = i.area
  FROM public.issues i
 WHERE i.id = p.issue_id
   AND p.area IS NULL
   AND i.area IS NOT NULL;

-- Any program whose issue carries no area predates the whole-game taxonomy, when the
-- catalog was full swing and nothing else. Same reasoning as the practice_sessions
-- backfill in 20260804000000. This matters more here than there: `area` is about to be
-- half of a NOT-NULL-in-practice unique index, and a NULL would silently opt the row out
-- of the cap entirely (NULLs are never equal in a unique index, so a user could stack
-- unlimited area-less programs).
UPDATE public.programs SET area = 'FULL_SWING' WHERE area IS NULL AND status = 'active';

-- --------------------------------------------------------------------------------------
-- 2. slot
-- --------------------------------------------------------------------------------------

ALTER TABLE public.programs
    ADD COLUMN IF NOT EXISTS slot integer NOT NULL DEFAULT 0;

ALTER TABLE public.programs
    DROP CONSTRAINT IF EXISTS programs_slot_check;
ALTER TABLE public.programs
    ADD CONSTRAINT programs_slot_check CHECK (slot IN (0, 1));

-- --------------------------------------------------------------------------------------
-- 3. Reconcile existing rows BEFORE the indexes exist
--
-- Every active program currently defaults to slot 0. If any user holds more than one
-- active program in the same area, creating the unique index below would fail and take the
-- whole deploy down with it. In theory the old application guard made that impossible; in
-- practice the guard was a bare read-then-write with no lock, so a double-submit could
-- always have slipped two rows through. Reconciling costs nothing and removes a failure
-- mode that would only ever surface at deploy time against production data.
-- --------------------------------------------------------------------------------------

-- 3a. Duplicate active programs on the SAME issue: keep the newest, abandon the rest.
--     Two programs on one issue would groove identical drill sets against separate
--     counters -- there is no mechanism that makes them diverge, so the extra row is
--     noise, not user work.
WITH ranked AS (
    SELECT id,
           row_number() OVER (
               PARTITION BY user_id, issue_id ORDER BY created_at DESC
           ) AS rn
      FROM public.programs
     WHERE status = 'active'
       AND issue_id IS NOT NULL
)
UPDATE public.programs p
   SET status = 'abandoned'
  FROM ranked
 WHERE p.id = ranked.id
   AND ranked.rn > 1;

-- 3b. Assign slots within each (user, area), oldest first, and abandon anything past the
--     second. Oldest-first so the program the golfer has invested the most in keeps slot 0
--     and survives; if anything has to be dropped it is the most recently opened.
WITH ranked AS (
    SELECT id,
           row_number() OVER (
               PARTITION BY user_id, area ORDER BY created_at
           ) - 1 AS rn
      FROM public.programs
     WHERE status = 'active'
)
UPDATE public.programs p
   SET slot   = CASE WHEN ranked.rn < 2 THEN ranked.rn ELSE p.slot END,
       status = CASE WHEN ranked.rn < 2 THEN p.status ELSE 'abandoned' END
  FROM ranked
 WHERE p.id = ranked.id;

-- --------------------------------------------------------------------------------------
-- 4. The cap, as a real constraint
--
-- Both are partial on status = 'active', so completing or abandoning a program frees its
-- slot immediately with no extra bookkeeping.
-- --------------------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS programs_one_active_per_area_slot
    ON public.programs (user_id, area, slot)
 WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS programs_one_active_per_issue
    ON public.programs (user_id, issue_id)
 WHERE status = 'active';

-- The list endpoint reads every active program for one user on each Home render.
CREATE INDEX IF NOT EXISTS idx_programs_user_active_area
    ON public.programs (user_id, status, area);

-- --------------------------------------------------------------------------------------
-- 5. Play steps go
-- --------------------------------------------------------------------------------------

DELETE FROM public.program_steps WHERE session_type = 'play';

-- --------------------------------------------------------------------------------------
-- 6. practice_sessions.program_step_id: dead column
--
-- 20260804000000 already documented that nothing in the codebase writes it, which is why
-- that migration had to add a stored `area` instead of joining through it. Removing it now
-- so the next person does not rediscover the same dead end.
-- --------------------------------------------------------------------------------------

ALTER TABLE public.practice_sessions DROP COLUMN IF EXISTS program_step_id;

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in 20260804000000)
-- --------------------------------------------------------------------------------------
--   ALTER TABLE public.practice_sessions
--       ADD COLUMN IF NOT EXISTS program_step_id uuid
--       REFERENCES public.program_steps(id) ON DELETE SET NULL;
--   DROP INDEX IF EXISTS public.idx_programs_user_active_area;
--   DROP INDEX IF EXISTS public.programs_one_active_per_issue;
--   DROP INDEX IF EXISTS public.programs_one_active_per_area_slot;
--   ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_slot_check;
--   ALTER TABLE public.programs DROP COLUMN IF EXISTS slot;
--   ALTER TABLE public.programs DROP COLUMN IF EXISTS area;
--
-- NOT fully reversible. Step 5 deletes rows and steps 3a/3b rewrite `status`; neither is
-- recoverable from this file. Take a dump of `programs` and `program_steps` before running
-- this in production. Restoring program_step_id restores an always-empty column.
