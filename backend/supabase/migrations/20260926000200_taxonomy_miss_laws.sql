-- Link each miss to the laws of ball flight that can cause it.
--
-- A miss is a description of ball flight, so it already narrows the law down before the
-- AI sees the video: a slice is a FACE or PATH problem, never SPEED. The analysis picks
-- the law from a miss's candidates instead of from all six. A miss with no links means
-- every law is a candidate, so a new miss works before a coach maps it.
--
-- Many-to-many: a slice involves both FACE and PATH, and FACE sits behind several misses.
--
-- Ranked per miss: rank 1 is the law most likely behind it. Unique per miss, so there is
-- always one first candidate. DEFERRABLE INITIALLY DEFERRED so a reorder can swap two
-- ranks inside one transaction.
--
-- Depends on 20260926000000_taxonomy_laws.sql.
--
-- No seed: the links are coach-authored data, entered through the admin surface.

-- ---------- table ----------
--
-- miss CASCADE: the links are part of the miss's definition, so they go with it. Deleting
-- a miss is already guarded by RESTRICT from issue_misses.
-- law RESTRICT: same as issue_laws. Retire a law with active = false instead.

CREATE TABLE IF NOT EXISTS public.taxonomy_miss_laws (
    miss text NOT NULL REFERENCES public.taxonomy_misses(key) ON DELETE CASCADE,
    law  text NOT NULL REFERENCES public.taxonomy_laws(key)   ON DELETE RESTRICT,
    rank integer NOT NULL CHECK (rank > 0),
    CONSTRAINT taxonomy_miss_laws_pkey PRIMARY KEY (miss, law),
    CONSTRAINT uq_taxonomy_miss_laws_miss_rank UNIQUE (miss, rank) DEFERRABLE INITIALLY DEFERRED
);

-- The primary key covers lookups by miss; this one serves "which misses does this law cause".
CREATE INDEX IF NOT EXISTS idx_taxonomy_miss_laws_law ON public.taxonomy_miss_laws (law);

ALTER TABLE public.taxonomy_miss_laws OWNER TO postgres;

-- ---------- grants: lock down in the same migration that creates it ----------
--
-- Same as the other taxonomy tables: reads open, writes only through the backend.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.taxonomy_miss_laws FROM anon, authenticated;
GRANT SELECT ON TABLE public.taxonomy_miss_laws TO anon, authenticated;
GRANT ALL ON TABLE public.taxonomy_miss_laws TO service_role;

ALTER TABLE public.taxonomy_miss_laws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS taxonomy_miss_laws_public_select ON public.taxonomy_miss_laws;
CREATE POLICY taxonomy_miss_laws_public_select ON public.taxonomy_miss_laws FOR SELECT USING (true);

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo. Run it
-- before rolling back 20260926000000_taxonomy_laws.sql.
--
--   DROP POLICY IF EXISTS taxonomy_miss_laws_public_select ON public.taxonomy_miss_laws;
--   DROP TABLE IF EXISTS public.taxonomy_miss_laws;
