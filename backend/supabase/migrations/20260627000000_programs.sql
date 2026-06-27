-- Migration: programs
-- Purpose: Practice program engine. A diagnosed analysis_issue spawns a finite,
-- ordered program of prescribed sessions ("steps"). Phases are measured in
-- sessions completed (not weeks) and blend range work with on-course play, with
-- a re-test step interleaved on a fixed cadence. Practice sessions can link back
-- to the program step they fulfilled.

BEGIN;

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  analysis_issue_id uuid REFERENCES public.analysis_issues(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','abandoned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.program_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  session_type text NOT NULL
    CHECK (session_type IN ('range','play','retest')),
  prescription jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','skipped')),
  practice_session_id uuid REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tie a practice session to the program step it fulfilled (nullable: ad-hoc
-- practice outside a program is still allowed).
ALTER TABLE public.practice_sessions
  ADD COLUMN session_type text
    CHECK (session_type IN ('range','play','retest')),
  ADD COLUMN program_step_id uuid REFERENCES public.program_steps(id) ON DELETE SET NULL;

CREATE INDEX idx_programs_user ON public.programs(user_id);
CREATE INDEX idx_programs_user_status ON public.programs(user_id, status);
CREATE INDEX idx_programs_analysis_issue ON public.programs(analysis_issue_id);

CREATE INDEX idx_program_steps_program ON public.program_steps(program_id);
CREATE UNIQUE INDEX idx_program_steps_unique_order ON public.program_steps(program_id, order_index);

CREATE INDEX idx_practice_sessions_program_step ON public.practice_sessions(program_step_id);

-- -----------------------------------------------------------------------------
-- RLS: users may read their own programs/steps; all writes are service-role only
-- (the backend connects with a privileged role, consistent with existing tables).
-- -----------------------------------------------------------------------------

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY programs_owner_select
ON public.programs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY program_steps_owner_select
ON public.program_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.programs p
    WHERE p.id = program_steps.program_id
      AND p.user_id = auth.uid()
  )
);

REVOKE INSERT, UPDATE, DELETE ON public.programs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.program_steps FROM authenticated;

COMMIT;
