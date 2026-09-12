-- Add 'inactive' as a program status, for the free-tier lapse/resub cycle.
--
-- A free-tier golfer who once subscribed and stacked several active focuses must not lose
-- that work the moment their subscription lapses. Instead of deleting or abandoning the
-- extra programs (both destructive -- `abandoned` already means "the golfer gave up on
-- this", which is not what happened here), they move to a new terminal-but-recoverable
-- status: 'inactive'. The oldest program stays active (see program_service.
-- deactivate_extra_focuses); the rest sit inactive until either the golfer resubscribes
-- (program_service.reactivate_on_resub restores whichever ones still have a free slot) or
-- completes/abandons the active one and manually reactivates a specific focus.
--
-- `deactivated_at` records when a program was benched, for support debugging ("why did my
-- program disappear") and so a future admin tool can show "inactive since ...".
--
-- Additive and zero-downtime:
--   - Widening a CHECK constraint never conflicts with in-flight rows (no existing row is
--     'inactive', but even if one were, IN (...) with a strict superset of the old list is
--     compatible with every row that satisfied the old constraint).
--   - `deactivated_at` is a nullable column with no default, so existing rows are
--     unaffected and no backfill is needed -- see 20260804000000 / 20260805000000 for the
--     pattern of only backfilling when a column becomes part of a NOT-NULL-in-practice
--     index, which is not the case here.
--   - Neither the app's old code (which never writes 'inactive') nor its new code
--     (deployed after this migration) breaks: this is a superset of the previous schema.

ALTER TABLE public.programs
    DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE public.programs
    ADD CONSTRAINT programs_status_check
    CHECK (status IN ('active', 'completed', 'abandoned', 'inactive'));

ALTER TABLE public.programs
    ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- --------------------------------------------------------------------------------------
-- Rollback (Supabase has no down-migrations; hand-written, as in prior migrations)
-- --------------------------------------------------------------------------------------
--   ALTER TABLE public.programs DROP COLUMN IF EXISTS deactivated_at;
--   ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_status_check;
--   ALTER TABLE public.programs
--       ADD CONSTRAINT programs_status_check
--       CHECK (status IN ('active', 'completed', 'abandoned'));
--
-- Only safe to roll back before any row is ever set to 'inactive' -- otherwise the
-- reinstated CHECK constraint will reject those rows and the ALTER TABLE will fail. Reset
-- any 'inactive' rows to 'active' or 'abandoned' first if this is ever rolled back for real.
