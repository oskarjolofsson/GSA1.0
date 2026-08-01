-- Move the practice taxonomy out of source code and into the database.
--
-- The vocabulary (areas, goals, misses) currently lives in FOUR hand-synced copies:
--   the CHECK constraints in 20260711000000_issue_goal_miss.sql
--   backend/core/services/taxonomy.py
--   trueswing_admin/features/content/constants.ts
--   TrueSwing-expo-app/features/library/constants/Misses.ts
--
-- Eight misses is survivable. Extending to five areas of the game means roughly forty,
-- each needing a coach label and a golfer-facing one, and today every addition costs a
-- migration plus three file edits. That friction is what would stop the content ever
-- getting authored, so it goes first.
--
-- This migration only creates and seeds. The CHECK -> FK swap is 20260802000100, kept
-- separate so a failure there is easy to read.
--
-- Deliberately NOT included: any rename or deletion of existing values. The expo app
-- matches on these keys client-side (LibraryScreen: i.goals?.includes(g.key)) against a
-- hardcoded constants file, so renaming a goal server-side would make every goal render
-- "Coming soon" with a zero count on any build that has not been updated. Renames belong
-- with the expo release, not here.

-- ---------- tables ----------
--
-- Written out in full rather than `create table ... (like ... including all)`: these are
-- foreign-key targets and their uniqueness should be obvious at a glance.
--
-- Column roles, consistent across all three:
--   label         coach vocabulary, admin-facing        "Slice"
--   golfer_label  golfer-facing title                   "I slice it"
--   blurb         golfer-facing subtitle, nullable      "Curves hard right"
--
-- `blurb` on misses exists because today the description is crammed into the label as a
-- parenthetical ("I slice it (curves hard right)"), since MissList renders one <Text>
-- while GoalGrid renders a title plus subtitle. Splitting them lets the two match, and
-- short-game vocabulary needs the subtitle far more than full swing does: every golfer
-- knows what a slice is, almost none could name a chunk.

CREATE TABLE IF NOT EXISTS public.taxonomy_areas (
    key          text PRIMARY KEY,
    label        text NOT NULL,
    golfer_label text NOT NULL,
    blurb        text,
    sort         integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.taxonomy_goals (
    key          text PRIMARY KEY,
    label        text NOT NULL,
    golfer_label text NOT NULL,
    blurb        text,
    sort         integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true
);

-- A miss belongs to exactly one area: a putt is not sliced, a chip is not hooked. This is
-- what makes area-scoped validation possible — normalize_misses_strict(values, area) can
-- refuse SLICE on a chipping issue. ON DELETE RESTRICT so removing an area with misses
-- still attached fails loudly instead of orphaning them.
CREATE TABLE IF NOT EXISTS public.taxonomy_misses (
    key          text PRIMARY KEY,
    area         text NOT NULL REFERENCES public.taxonomy_areas(key) ON DELETE RESTRICT,
    label        text NOT NULL,
    golfer_label text NOT NULL,
    blurb        text,
    sort         integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_misses_area ON public.taxonomy_misses (area);

ALTER TABLE public.taxonomy_areas  OWNER TO postgres;
ALTER TABLE public.taxonomy_goals  OWNER TO postgres;
ALTER TABLE public.taxonomy_misses OWNER TO postgres;

-- ---------- grants: lock these down in the SAME migration that creates them ----------
--
-- Supabase's default privileges on the public schema hand new tables full INSERT/UPDATE/
-- DELETE to anon and authenticated. The anon key ships inside the mobile app binary, so a
-- table created without this block is world-writable through PostgREST from the moment it
-- exists. issue_goals and issue_misses picked exactly that up when they were created in
-- 20260711000000 and stayed open until 20260730010000 — nineteen days.
--
-- Reads stay open: clients render pickers from this vocabulary. Writes go through the
-- FastAPI backend, which connects as the `postgres` owner over DATABASE_URL and therefore
-- bypasses RLS entirely, so admin CRUD is unaffected by anything here.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
    public.taxonomy_areas, public.taxonomy_goals, public.taxonomy_misses
    FROM anon, authenticated;

GRANT SELECT ON TABLE
    public.taxonomy_areas, public.taxonomy_goals, public.taxonomy_misses
    TO anon, authenticated;

GRANT ALL ON TABLE
    public.taxonomy_areas, public.taxonomy_goals, public.taxonomy_misses
    TO service_role;

-- RLS on top of the REVOKEs is defence in depth: a future migration that re-grants writes,
-- or a new role, still cannot mutate these without someone deliberately adding a policy.
ALTER TABLE public.taxonomy_areas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_misses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS taxonomy_areas_public_select  ON public.taxonomy_areas;
DROP POLICY IF EXISTS taxonomy_goals_public_select  ON public.taxonomy_goals;
DROP POLICY IF EXISTS taxonomy_misses_public_select ON public.taxonomy_misses;

CREATE POLICY taxonomy_areas_public_select  ON public.taxonomy_areas  FOR SELECT USING (true);
CREATE POLICY taxonomy_goals_public_select  ON public.taxonomy_goals  FOR SELECT USING (true);
CREATE POLICY taxonomy_misses_public_select ON public.taxonomy_misses FOR SELECT USING (true);

-- ---------- seed: today's vocabulary, verbatim ----------
--
-- Same keys the CHECK constraints already allow, so 20260802000100 can add its foreign
-- keys without a single existing row failing.

INSERT INTO public.taxonomy_areas (key, label, golfer_label, blurb, sort) VALUES
    ('FULL_SWING', 'Full swing', 'Full swing', 'Driver through wedge, off the tee and into greens', 10),
    ('CHIPPING',   'Chipping',   'Chipping',   'Short shots around the green',                      20),
    ('PITCHING',   'Pitching',   'Pitching',   'Partial wedges, roughly 30 to 100 yards',           30),
    ('BUNKER',     'Bunker',     'Bunker',     'Greenside sand',                                    40),
    ('PUTTING',    'Putting',    'Putting',    'On the green',                                      50)
ON CONFLICT (key) DO NOTHING;

-- Goals are seeded unchanged, including SHORT_GAME and PUTTING. Those two collide with the
-- area axis and are resolved in Slice C, together with the expo release that stops matching
-- on the old keys client-side.
INSERT INTO public.taxonomy_goals (key, label, golfer_label, blurb, sort) VALUES
    ('STRAIGHTER', 'Straighter',       'Hit it straighter',   'Control where the ball starts and curves', 10),
    ('DISTANCE',   'Distance',         'More distance',       'More speed and solid strikes for carry',   20),
    ('CONTACT',    'Contact',          'Better contact',      'Flush it off the middle of the face',      30),
    ('BIG_MISS',   'Kill the big miss','Kill the big miss',   'Stop the round-wrecking shot',             40),
    ('SHORT_GAME', 'Short game',       'Sharper short game',  'Chips, pitches and bunkers',               50),
    ('PUTTING',    'Putting',          'Better putting',      'Roll it on line, control the speed',       60)
ON CONFLICT (key) DO NOTHING;

-- All eight existing misses are full-swing ball flight. Six split cleanly on the
-- parenthetical that TrueSwing-expo-app/features/library/constants/Misses.ts crams into a
-- single label; THIN and LOW_WEAK had no description there and get one written here.
INSERT INTO public.taxonomy_misses (key, area, label, golfer_label, blurb, sort) VALUES
    ('SLICE',    'FULL_SWING', 'Slice',       'I slice it',        'Curves hard right',            10),
    ('HOOK',     'FULL_SWING', 'Hook',        'I hook it',         'Curves hard left',             20),
    ('PULL',     'FULL_SWING', 'Pull',        'I pull it',         'Starts left, stays left',      30),
    ('PUSH',     'FULL_SWING', 'Push',        'I push it',         'Starts right, stays right',    40),
    ('TOP',      'FULL_SWING', 'Top',         'I top it',          'Thin, low, along the ground',  50),
    ('THIN',     'FULL_SWING', 'Thin',        'I catch it thin',   'Struck low on the face, feels harsh and flies flat', 60),
    ('FAT',      'FULL_SWING', 'Fat',         'I hit it fat',      'Ground first',                 70),
    ('LOW_WEAK', 'FULL_SWING', 'Low / weak',  'Low, weak flight',  'Gets up but goes nowhere, no carry', 80)
ON CONFLICT (key) DO NOTHING;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo. Run it only
-- after reverting 20260802000100, whose foreign keys depend on these tables existing.
--
--   DROP POLICY IF EXISTS taxonomy_areas_public_select  ON public.taxonomy_areas;
--   DROP POLICY IF EXISTS taxonomy_goals_public_select  ON public.taxonomy_goals;
--   DROP POLICY IF EXISTS taxonomy_misses_public_select ON public.taxonomy_misses;
--   DROP TABLE IF EXISTS public.taxonomy_misses;
--   DROP TABLE IF EXISTS public.taxonomy_goals;
--   DROP TABLE IF EXISTS public.taxonomy_areas;
