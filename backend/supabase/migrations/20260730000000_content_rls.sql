-- Lock the content catalog down to read-only for client roles.
--
-- issues, drills and issue_drill were created with RLS disabled and GRANT ALL to
-- anon and authenticated. The anon key ships inside the mobile app, so anyone who
-- extracts it could INSERT, UPDATE or DELETE the entire catalog through PostgREST.
--
-- Reads stay open: the catalog is public content. Writes go through the FastAPI
-- backend, which connects as the `postgres` owner over DATABASE_URL and therefore
-- bypasses RLS entirely — no application code changes with this migration.
--
-- issue_goals and issue_misses were created with no grants at all, so PostgREST
-- could not see them even though their parent rows were readable. They are granted
-- SELECT here so a client reading the catalog gets whole issues rather than
-- untagged ones.
--
-- Idempotent: safe to re-run.

-- ---------- writes: client roles lose them ----------

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.issues       FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.drills       FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.issue_drill  FROM anon, authenticated;

-- ---------- reads: explicit, including the tag tables ----------

GRANT SELECT ON TABLE public.issues       TO anon, authenticated;
GRANT SELECT ON TABLE public.drills       TO anon, authenticated;
GRANT SELECT ON TABLE public.issue_drill  TO anon, authenticated;
GRANT SELECT ON TABLE public.issue_goals  TO anon, authenticated;
GRANT SELECT ON TABLE public.issue_misses TO anon, authenticated;

-- service_role keeps full access; it is the break-glass path for tooling.
GRANT ALL ON TABLE public.issue_goals  TO service_role;
GRANT ALL ON TABLE public.issue_misses TO service_role;

-- ---------- RLS: defence in depth behind the grants ----------
--
-- The REVOKEs above already stop client writes. Enabling RLS as well means a future
-- migration that re-grants writes (or a new role) still cannot mutate these tables
-- without someone deliberately adding a write policy.

ALTER TABLE public.issues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_drill  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_misses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS issues_public_select       ON public.issues;
DROP POLICY IF EXISTS drills_public_select       ON public.drills;
DROP POLICY IF EXISTS issue_drill_public_select  ON public.issue_drill;
DROP POLICY IF EXISTS issue_goals_public_select  ON public.issue_goals;
DROP POLICY IF EXISTS issue_misses_public_select ON public.issue_misses;

CREATE POLICY issues_public_select       ON public.issues       FOR SELECT USING (true);
CREATE POLICY drills_public_select       ON public.drills       FOR SELECT USING (true);
CREATE POLICY issue_drill_public_select  ON public.issue_drill  FOR SELECT USING (true);
CREATE POLICY issue_goals_public_select  ON public.issue_goals  FOR SELECT USING (true);
CREATE POLICY issue_misses_public_select ON public.issue_misses FOR SELECT USING (true);

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo.
-- Restores the pre-migration state exactly (GRANT ALL, RLS off, no policies).
--
--   DROP POLICY IF EXISTS issues_public_select       ON public.issues;
--   DROP POLICY IF EXISTS drills_public_select       ON public.drills;
--   DROP POLICY IF EXISTS issue_drill_public_select  ON public.issue_drill;
--   DROP POLICY IF EXISTS issue_goals_public_select  ON public.issue_goals;
--   DROP POLICY IF EXISTS issue_misses_public_select ON public.issue_misses;
--
--   ALTER TABLE public.issues       DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.drills       DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.issue_drill  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.issue_goals  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.issue_misses DISABLE ROW LEVEL SECURITY;
--
--   GRANT ALL ON TABLE public.issues      TO anon, authenticated;
--   GRANT ALL ON TABLE public.drills      TO anon, authenticated;
--   GRANT ALL ON TABLE public.issue_drill TO anon, authenticated;
--   REVOKE ALL ON TABLE public.issue_goals  FROM anon, authenticated;
--   REVOKE ALL ON TABLE public.issue_misses FROM anon, authenticated;
