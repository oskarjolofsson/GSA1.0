-- User-authored issues & drills: let a program be seeded from a user-created
-- issue (coach feedback) or a browsed catalog issue, not just an AI analysis.
--
-- issues/drills gain an optional owner (user_id NULL = admin-curated global
-- catalog; set = user-authored custom). programs gain a direct issue_id so a
-- program can groove an issue with no source analysis. analysis_issue_id stays
-- for AI provenance.

-- ---------- issues ----------
ALTER TABLE "public"."issues"
    ADD COLUMN IF NOT EXISTS "user_id" "uuid",
    ADD COLUMN IF NOT EXISTS "source" "text" NOT NULL DEFAULT 'catalog';

ALTER TABLE "public"."issues"
    DROP CONSTRAINT IF EXISTS "issues_source_check";
ALTER TABLE "public"."issues"
    ADD CONSTRAINT "issues_source_check"
    CHECK (("source" = ANY (ARRAY['catalog'::"text", 'custom'::"text"])));

CREATE INDEX IF NOT EXISTS "idx_issues_user_id" ON "public"."issues" ("user_id");

-- ---------- drills ----------
ALTER TABLE "public"."drills"
    ADD COLUMN IF NOT EXISTS "user_id" "uuid";

CREATE INDEX IF NOT EXISTS "idx_drills_user_id" ON "public"."drills" ("user_id");

-- ---------- programs ----------
ALTER TABLE "public"."programs"
    ADD COLUMN IF NOT EXISTS "issue_id" "uuid";

ALTER TABLE "public"."programs"
    DROP CONSTRAINT IF EXISTS "programs_issue_id_fkey";
ALTER TABLE "public"."programs"
    ADD CONSTRAINT "programs_issue_id_fkey"
    FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_programs_issue_id" ON "public"."programs" ("issue_id");

-- Backfill issue_id for existing AI-seeded programs so reads are uniform.
UPDATE "public"."programs" p
SET "issue_id" = ai."issue_id"
FROM "public"."analysis_issues" ai
WHERE p."analysis_issue_id" = ai."id"
  AND p."issue_id" IS NULL;
