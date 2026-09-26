-- Add the laws of ball flight to the taxonomy.
--
-- The AI analysis maps a golfer's miss and swing video to drills in three layers:
--   law    the physical cause (face, path, ...)       taxonomy_laws   <- this migration
--   issue  the swing fault that breaks the law        issues
--   drill  what fixes the issue                       drills, via issue_drill
--
-- The six laws follow https://swingdictionary.golf/laws-of-ball-flight/: Dr. Gary Wiren's
-- original five, plus dynamic loft (added 2018).
--
-- This migration only creates and seeds the vocabulary. The issue <-> law junction comes
-- separately, so the table can be reviewed on its own.
--
-- Not scoped to an area, unlike taxonomy_misses: face, path and speed decide a putt as much
-- as a drive. The area comes from the miss the golfer picked.

-- ---------- table ----------
--
-- Same shape and column roles as taxonomy_areas / taxonomy_goals:
--   label         coach vocabulary, admin-facing        "Face"
--   golfer_label  golfer-facing title                   "Where the clubface points"
--   blurb         golfer-facing subtitle, nullable      "Open or closed at impact"

CREATE TABLE IF NOT EXISTS public.taxonomy_laws (
    key          text PRIMARY KEY,
    label        text NOT NULL,
    golfer_label text NOT NULL,
    blurb        text,
    sort         integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true
);

ALTER TABLE public.taxonomy_laws OWNER TO postgres;

-- ---------- grants: lock down in the same migration that creates it ----------
--
-- Same reasoning as 20260802000000_taxonomy_tables.sql: Supabase's default privileges make
-- a new public table writable by anon, and the anon key ships in the app binary. Reads stay
-- open; writes go through the backend as `postgres`.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.taxonomy_laws FROM anon, authenticated;
GRANT SELECT ON TABLE public.taxonomy_laws TO anon, authenticated;
GRANT ALL ON TABLE public.taxonomy_laws TO service_role;

ALTER TABLE public.taxonomy_laws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS taxonomy_laws_public_select ON public.taxonomy_laws;
CREATE POLICY taxonomy_laws_public_select ON public.taxonomy_laws FOR SELECT USING (true);

-- ---------- seed ----------
--
-- Direction first (face, path), then strike and launch, then speed. Face leads because it
-- decides most of where the ball starts.

INSERT INTO public.taxonomy_laws (key, label, golfer_label, blurb, sort) VALUES
    ('FACE',            'Face',                     'Where the clubface points',  'Open or closed to the path at impact, sets start line and curve', 10),
    ('PATH',            'Path',                     'Which way the club swings',  'In-to-out or out-to-in through impact',                            20),
    ('CENTEREDNESS',    'Centeredness of contact',  'Where you strike the face',  'Heel, toe, high or low instead of the middle',                     30),
    ('ANGLE_OF_ATTACK', 'Angle of attack',          'How steeply you hit down',   'Too steep digs, too shallow catches it thin',                      40),
    ('DYNAMIC_LOFT',    'Dynamic loft',             'Loft at impact',             'Added or taken off the club, sets launch and spin',                50),
    ('SPEED',           'Speed',                    'Clubhead speed',             'How fast the club is moving through impact',                       60)
ON CONFLICT (key) DO NOTHING;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo. Revert any
-- migration with a foreign key into taxonomy_laws first.
--
--   DROP POLICY IF EXISTS taxonomy_laws_public_select ON public.taxonomy_laws;
--   DROP TABLE IF EXISTS public.taxonomy_laws;
