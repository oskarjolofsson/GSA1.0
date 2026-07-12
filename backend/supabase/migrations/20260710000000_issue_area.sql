-- Add an `area` taxonomy to issues so the practice Library can group issues by
-- area of the game (full swing, short game, putting, mental). Existing issues
-- are all full-swing, so backfill and default to FULL_SWING.

ALTER TABLE "public"."issues"
    ADD COLUMN IF NOT EXISTS "area" "text" NOT NULL DEFAULT 'FULL_SWING';

-- Backfill any pre-existing rows (defensive; the DEFAULT already covers them).
UPDATE "public"."issues" SET "area" = 'FULL_SWING' WHERE "area" IS NULL;

ALTER TABLE "public"."issues"
    DROP CONSTRAINT IF EXISTS "issues_area_check";
ALTER TABLE "public"."issues"
    ADD CONSTRAINT "issues_area_check"
    CHECK (("area" = ANY (ARRAY[
        'FULL_SWING'::"text",
        'CHIPPING'::"text",
        'PUTTING'::"text",
        'BUNKER'::"text",
        'PITCHING'::"text"
    ])));
