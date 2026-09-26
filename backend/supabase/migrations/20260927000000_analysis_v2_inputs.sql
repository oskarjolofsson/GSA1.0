-- Structured inputs and the chosen law for the v2 analysis flow.
--
-- v2 walks miss -> law -> issue -> drill (see 20260926000000_taxonomy_laws.sql). It needs
-- the golfer's area and miss as taxonomy keys rather than free text, and somewhere to
-- keep the law the AI settled on.
--
-- Everything here is nullable and additive. v1 keeps writing prompt_shape / prompt_height
-- / prompt_misses / prompt_extra and never touches these columns, so the shipped app is
-- unaffected. A v2 analysis is recognisable by prompts.area IS NOT NULL.
--
-- No grants: prompts and analysis were closed to client roles in
-- 20260730020000_close_remaining_tables.sql, and new columns inherit that.

-- ---------- prompts: what the golfer told us ----------
--
-- area / miss RESTRICT, like issues.area: deleting a term an analysis was made with fails
-- loudly. Retire it with active = false instead.
--
-- club_type / camera_view are nullable on purpose: areas other than full swing (putting,
-- chipping) may not ask for them. Null means "not given", so there is no 'unknown' value.
-- The allowed values are a CHECK rather than taxonomy tables until a coach needs to edit
-- them; the client still reads them from /taxonomy/, never from a local list.

ALTER TABLE public.prompts
    ADD COLUMN IF NOT EXISTS area        text REFERENCES public.taxonomy_areas(key)  ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS miss        text REFERENCES public.taxonomy_misses(key) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS notes       text,
    ADD COLUMN IF NOT EXISTS club_type   text,
    ADD COLUMN IF NOT EXISTS camera_view text;

ALTER TABLE public.prompts
    ADD CONSTRAINT prompts_club_type_check
        CHECK (club_type IN ('driver', 'wood', 'hybrid', 'iron', 'wedge', 'putter')),
    ADD CONSTRAINT prompts_camera_view_check
        CHECK (camera_view IN ('face_on', 'down_the_line'));

-- ---------- analysis: what the AI concluded ----------
--
-- The law of ball flight the analysis settled on. Null for v1 analyses, for v2 ones that
-- have not finished, and for failed ones.

ALTER TABLE public.analysis
    ADD COLUMN IF NOT EXISTS law text REFERENCES public.taxonomy_laws(key) ON DELETE RESTRICT;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism, so this is the manual undo.
--
--   ALTER TABLE public.analysis DROP COLUMN IF EXISTS law;
--   ALTER TABLE public.prompts
--       DROP CONSTRAINT IF EXISTS prompts_camera_view_check,
--       DROP CONSTRAINT IF EXISTS prompts_club_type_check,
--       DROP COLUMN IF EXISTS camera_view,
--       DROP COLUMN IF EXISTS club_type,
--       DROP COLUMN IF EXISTS notes,
--       DROP COLUMN IF EXISTS miss,
--       DROP COLUMN IF EXISTS area;
