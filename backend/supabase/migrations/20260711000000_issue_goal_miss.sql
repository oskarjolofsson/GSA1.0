-- Goal-first library taxonomy.
--
-- Reconcile the `area` set to the canonical course-location vocabulary, add the
-- golfer-facing layer (kind + plain-language fields), drop the now-unused `phase`
-- column (its only reader was the library's swing-phase filter, now removed), and
-- add the many-to-many goal/miss tag tables that drive goal->miss->issue browsing.

-- ---------- reconcile area to the course-location set ----------
-- Existing rows may hold legacy values (SHORT_GAME/MENTAL); map them forward
-- before tightening the constraint so the new CHECK doesn't reject them.
UPDATE "public"."issues" SET "area" = 'CHIPPING' WHERE "area" = 'SHORT_GAME';
UPDATE "public"."issues" SET "area" = 'FULL_SWING' WHERE "area" = 'MENTAL';
UPDATE "public"."issues" SET "area" = 'FULL_SWING' WHERE "area" IS NULL;

ALTER TABLE "public"."issues" DROP CONSTRAINT IF EXISTS "issues_area_check";
ALTER TABLE "public"."issues"
    ADD CONSTRAINT "issues_area_check"
    CHECK (("area" = ANY (ARRAY[
        'FULL_SWING'::"text",
        'CHIPPING'::"text",
        'PUTTING'::"text",
        'BUNKER'::"text",
        'PITCHING'::"text"
    ])));

-- ---------- golfer-facing layer ----------
ALTER TABLE "public"."issues"
    ADD COLUMN IF NOT EXISTS "kind" "text" NOT NULL DEFAULT 'fault',
    ADD COLUMN IF NOT EXISTS "layman_title" "text",
    ADD COLUMN IF NOT EXISTS "layman_desc" "text";

ALTER TABLE "public"."issues" DROP CONSTRAINT IF EXISTS "issues_kind_check";
ALTER TABLE "public"."issues"
    ADD CONSTRAINT "issues_kind_check"
    CHECK (("kind" = ANY (ARRAY['fault'::"text", 'skill'::"text"])));

-- ---------- drop phase ----------
DROP INDEX IF EXISTS "idx_issues_phase";
ALTER TABLE "public"."issues" DROP CONSTRAINT IF EXISTS "issues_phase_check";
ALTER TABLE "public"."issues" DROP COLUMN IF EXISTS "phase";

-- ---------- goal tags (WHY) ----------
CREATE TABLE IF NOT EXISTS "public"."issue_goals" (
    "issue_id" "uuid" NOT NULL,
    "goal" "text" NOT NULL,
    CONSTRAINT "issue_goals_pkey" PRIMARY KEY ("issue_id", "goal"),
    CONSTRAINT "issue_goals_issue_id_fkey"
        FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE,
    CONSTRAINT "issue_goals_goal_check"
        CHECK (("goal" = ANY (ARRAY[
            'STRAIGHTER'::"text",
            'DISTANCE'::"text",
            'CONTACT'::"text",
            'BIG_MISS'::"text",
            'SHORT_GAME'::"text",
            'PUTTING'::"text"
        ])))
);
CREATE INDEX IF NOT EXISTS "idx_issue_goals_goal" ON "public"."issue_goals" ("goal");

-- ---------- miss tags (WHAT the golfer sees) ----------
CREATE TABLE IF NOT EXISTS "public"."issue_misses" (
    "issue_id" "uuid" NOT NULL,
    "miss" "text" NOT NULL,
    CONSTRAINT "issue_misses_pkey" PRIMARY KEY ("issue_id", "miss"),
    CONSTRAINT "issue_misses_issue_id_fkey"
        FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE,
    CONSTRAINT "issue_misses_miss_check"
        CHECK (("miss" = ANY (ARRAY[
            'SLICE'::"text",
            'HOOK'::"text",
            'PULL'::"text",
            'PUSH'::"text",
            'TOP'::"text",
            'THIN'::"text",
            'FAT'::"text",
            'LOW_WEAK'::"text"
        ])))
);
CREATE INDEX IF NOT EXISTS "idx_issue_misses_miss" ON "public"."issue_misses" ("miss");
