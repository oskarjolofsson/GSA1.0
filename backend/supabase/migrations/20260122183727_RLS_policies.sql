-- Migration: RLS_policies
-- Purpose: Enable Row Level Security and add defense-in-depth policies
-- for a golf analyser application.
--
-- Assumptions:
--   - Users authenticate via Supabase Auth (auth.uid()).
--   - End users must only ever access their own data.
--   - analysis_issues and analysis_drills are backend/service-controlled for writes.
--   - mandatory_consent is reference data (read-only for users).

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Enable RLS on all relevant tables
-- -----------------------------------------------------------------------------

ALTER TABLE public.mandatory_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_issues   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_drills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent      ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2) mandatory_consent (reference data: read-only)
-- -----------------------------------------------------------------------------

CREATE POLICY mandatory_consent_read
ON public.mandatory_consent
FOR SELECT
USING (true);

-- -----------------------------------------------------------------------------
-- 3) profiles (scoped to self via id = auth.uid())
-- -----------------------------------------------------------------------------

CREATE POLICY profiles_owner_select
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY profiles_owner_insert
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_owner_update
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Optional: allow users to delete their own profile.
-- Remove this policy if you do not want self-deletion.
CREATE POLICY profiles_owner_delete
ON public.profiles
FOR DELETE
USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4) videos (user-owned)
-- -----------------------------------------------------------------------------

CREATE POLICY videos_owner_select
ON public.videos
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY videos_owner_insert
ON public.videos
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY videos_owner_update
ON public.videos
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY videos_owner_delete
ON public.videos
FOR DELETE
USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5) analysis (user-owned; lifecycle fields hardened via REVOKE below)
-- -----------------------------------------------------------------------------

CREATE POLICY analysis_owner_select
ON public.analysis
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY analysis_owner_insert
ON public.analysis
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY analysis_owner_update
ON public.analysis
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY analysis_owner_delete
ON public.analysis
FOR DELETE
USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6) analysis_issues (indirect ownership via analysis; backend-only writes)
-- -----------------------------------------------------------------------------

CREATE POLICY analysis_issues_owner_select
ON public.analysis_issues
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.analysis a
    WHERE a.id = analysis_issues.analysis_id
      AND a.user_id = auth.uid()
  )
);

-- NOTE:
-- No INSERT / UPDATE / DELETE policies for authenticated users on analysis_issues.
-- Only the service role should be able to write this table.

-- -----------------------------------------------------------------------------
-- 7) analysis_drills (indirect ownership via analysis_issues -> analysis)
-- -----------------------------------------------------------------------------

CREATE POLICY analysis_drills_owner_select
ON public.analysis_drills
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.analysis_issues ai
    JOIN public.analysis a ON a.id = ai.analysis_id
    WHERE ai.id = analysis_drills.analysis_issue_id
      AND a.user_id = auth.uid()
  )
);

-- NOTE:
-- No INSERT / UPDATE / DELETE policies for authenticated users on analysis_drills.

-- -----------------------------------------------------------------------------
-- 8) user_consent (append-only from user perspective)
-- -----------------------------------------------------------------------------

CREATE POLICY user_consent_owner_select
ON public.user_consent
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_consent_owner_insert
ON public.user_consent
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- No UPDATE or DELETE policies: consent is append-only.

-- -----------------------------------------------------------------------------
-- 9) Privilege hardening (defense-in-depth via REVOKE)
-- -----------------------------------------------------------------------------

-- Prevent reassignment of ownership
REVOKE UPDATE (user_id) ON public.videos       FROM authenticated;
REVOKE UPDATE (user_id) ON public.analysis     FROM authenticated;
REVOKE UPDATE (user_id) ON public.user_consent FROM authenticated;

-- Prevent users from mutating system-controlled lifecycle fields on analysis
REVOKE UPDATE (
  status,
  success,
  raw_output_json,
  error_message,
  started_at,
  completed_at
) ON public.analysis FROM authenticated;

-- Prevent retroactive tampering with consent audit fields
REVOKE UPDATE (
  granted_at,
  ip_address,
  user_agent
) ON public.user_consent FROM authenticated;

-- Prevent end users from writing AI-derived outputs
REVOKE INSERT, UPDATE, DELETE ON public.analysis_issues FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.analysis_drills FROM authenticated;

-- Prevent end users from mutating reference data
REVOKE INSERT, UPDATE, DELETE ON public.mandatory_consent FROM authenticated;

COMMIT;
