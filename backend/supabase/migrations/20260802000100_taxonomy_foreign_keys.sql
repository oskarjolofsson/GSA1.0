-- Point the tag columns at the taxonomy tables instead of hardcoded CHECK lists.
--
-- Purely structural: 20260802000000 seeded exactly the values these CHECKs already allow,
-- so every existing row satisfies the new foreign keys and nothing is rewritten. Run it
-- after that migration — these constraints depend on those tables existing.
--
-- What this buys: adding a miss stops being a migration. It becomes an INSERT the admin
-- dashboard can make, which is the whole point of the exercise — roughly forty misses have
-- to be authored across four new areas of the game, and most of them will be wrong on the
-- first attempt.
--
-- NOT touched: issues_kind_check and issues_source_check. `kind` (fault/skill) and `source`
-- (catalog/custom) are two-value structural flags with no authoring story, so a CHECK is
-- the right tool and a lookup table would be ceremony.

-- ---------- issues.area ----------

ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_area_check;

ALTER TABLE public.issues
    ADD CONSTRAINT issues_area_fkey
    FOREIGN KEY (area) REFERENCES public.taxonomy_areas(key)
    ON DELETE RESTRICT;

-- ---------- issue_goals.goal ----------

ALTER TABLE public.issue_goals DROP CONSTRAINT IF EXISTS issue_goals_goal_check;

ALTER TABLE public.issue_goals
    ADD CONSTRAINT issue_goals_goal_fkey
    FOREIGN KEY (goal) REFERENCES public.taxonomy_goals(key)
    ON DELETE RESTRICT;

-- ---------- issue_misses.miss ----------
--
-- RESTRICT rather than CASCADE on all three: deleting a vocabulary value that issues still
-- carry should fail loudly and be counted back to the admin ("12 issues use this"), not
-- silently strip tags off content someone authored.

ALTER TABLE public.issue_misses DROP CONSTRAINT IF EXISTS issue_misses_miss_check;

ALTER TABLE public.issue_misses
    ADD CONSTRAINT issue_misses_miss_fkey
    FOREIGN KEY (miss) REFERENCES public.taxonomy_misses(key)
    ON DELETE RESTRICT;

-- Supporting indexes: without these, deleting a taxonomy row makes Postgres sequential-scan
-- the referencing table to check RESTRICT.
CREATE INDEX IF NOT EXISTS idx_issues_area        ON public.issues (area);
CREATE INDEX IF NOT EXISTS idx_issue_goals_goal   ON public.issue_goals (goal);
CREATE INDEX IF NOT EXISTS idx_issue_misses_miss  ON public.issue_misses (miss);

-- ---------- rollback ----------
--
-- Restores the CHECK constraints exactly as 20260710000000 and 20260711000000 wrote them.
--
--   ALTER TABLE public.issues        DROP CONSTRAINT IF EXISTS issues_area_fkey;
--   ALTER TABLE public.issue_goals   DROP CONSTRAINT IF EXISTS issue_goals_goal_fkey;
--   ALTER TABLE public.issue_misses  DROP CONSTRAINT IF EXISTS issue_misses_miss_fkey;
--
--   ALTER TABLE public.issues ADD CONSTRAINT issues_area_check
--     CHECK (area IN ('FULL_SWING','CHIPPING','PUTTING','BUNKER','PITCHING'));
--   ALTER TABLE public.issue_goals ADD CONSTRAINT issue_goals_goal_check
--     CHECK (goal IN ('STRAIGHTER','DISTANCE','CONTACT','BIG_MISS','SHORT_GAME','PUTTING'));
--   ALTER TABLE public.issue_misses ADD CONSTRAINT issue_misses_miss_check
--     CHECK (miss IN ('SLICE','HOOK','PULL','PUSH','TOP','THIN','FAT','LOW_WEAK'));
