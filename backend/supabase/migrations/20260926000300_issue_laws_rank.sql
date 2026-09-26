-- Rank the issues under each law: rank 1 is the issue that breaks the law most often.
--
-- The analysis picks a law, then walks its issues in rank order, so "which issue first"
-- is coach-authored data rather than alphabetical order.
--
-- Separate from 20260926000100_issue_laws.sql because that one may already be applied.
--
-- Unique per law, so there is always exactly one top issue. DEFERRABLE INITIALLY DEFERRED
-- so a reorder can swap two ranks inside one transaction without tripping the constraint
-- halfway through.

ALTER TABLE public.issue_laws ADD COLUMN IF NOT EXISTS rank integer;

-- Backfill any links authored before this migration. Arbitrary but stable order; a coach
-- re-ranks them afterwards.
UPDATE public.issue_laws il
SET rank = ranked.rn
FROM (
    SELECT issue_id, law, row_number() OVER (PARTITION BY law ORDER BY issue_id) AS rn
    FROM public.issue_laws
) ranked
WHERE il.issue_id = ranked.issue_id AND il.law = ranked.law AND il.rank IS NULL;

ALTER TABLE public.issue_laws ALTER COLUMN rank SET NOT NULL;

ALTER TABLE public.issue_laws
    ADD CONSTRAINT issue_laws_rank_positive CHECK (rank > 0);

ALTER TABLE public.issue_laws
    ADD CONSTRAINT uq_issue_laws_law_rank UNIQUE (law, rank) DEFERRABLE INITIALLY DEFERRED;

-- The unique constraint's index serves "issues under this law, in rank order", which is
-- what idx_issue_laws_law was for.
DROP INDEX IF EXISTS public.idx_issue_laws_law;

-- ---------- rollback ----------
--
--   CREATE INDEX IF NOT EXISTS idx_issue_laws_law ON public.issue_laws (law);
--   ALTER TABLE public.issue_laws DROP CONSTRAINT IF EXISTS uq_issue_laws_law_rank;
--   ALTER TABLE public.issue_laws DROP CONSTRAINT IF EXISTS issue_laws_rank_positive;
--   ALTER TABLE public.issue_laws DROP COLUMN IF EXISTS rank;
