-- Link issues to the laws of ball flight they break.
--
-- Many-to-many: one law (FACE) has several issues, and one issue can break several laws
-- (an over-the-top move breaks both PATH and ANGLE_OF_ATTACK). Same shape as issue_misses.
--
-- Depends on 20260926000000_taxonomy_laws.sql.
--
-- No backfill: existing issues start with no laws and get linked through authoring.

-- ---------- table ----------
--
-- issue_id CASCADE: deleting an issue clears its links.
-- law RESTRICT: deleting a law that issues still carry fails loudly rather than silently
-- stripping links off authored content. Retire a law with active = false instead.

CREATE TABLE IF NOT EXISTS public.issue_laws (
    issue_id uuid NOT NULL REFERENCES public.issues(id)        ON DELETE CASCADE,
    law      text NOT NULL REFERENCES public.taxonomy_laws(key) ON DELETE RESTRICT,
    CONSTRAINT issue_laws_pkey PRIMARY KEY (issue_id, law)
);

-- The primary key already covers lookups by issue_id; this one serves "all issues under
-- this law".
CREATE INDEX IF NOT EXISTS idx_issue_laws_law ON public.issue_laws (law);

ALTER TABLE public.issue_laws OWNER TO postgres;

-- ---------- grants: lock down in the same migration that creates it ----------
--
-- issue_goals and issue_misses were world-writable through PostgREST for nineteen days
-- because their lockdown came in a later migration (20260730010000). Not again. Reads
-- stay open, matching issue_misses; writes go through the backend as `postgres`.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.issue_laws FROM anon, authenticated;
GRANT SELECT ON TABLE public.issue_laws TO anon, authenticated;
GRANT ALL ON TABLE public.issue_laws TO service_role;

ALTER TABLE public.issue_laws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS issue_laws_public_select ON public.issue_laws;
CREATE POLICY issue_laws_public_select ON public.issue_laws FOR SELECT USING (true);

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo. Run it
-- before rolling back 20260926000000_taxonomy_laws.sql.
--
--   DROP POLICY IF EXISTS issue_laws_public_select ON public.issue_laws;
--   DROP TABLE IF EXISTS public.issue_laws;
