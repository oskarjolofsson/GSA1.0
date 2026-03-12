

CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  analysis_issue_id uuid REFERENCES public.analysis_issues(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','abandoned'))
);


CREATE TABLE public.practice_drill_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id),
  drill_id uuid NOT NULL REFERENCES public.drills(id),

  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  successful_reps integer NOT NULL DEFAULT 0,
  failed_reps integer NOT NULL DEFAULT 0,

  skipped boolean NOT NULL DEFAULT false,
  order_index integer
);


CREATE TABLE public.practice_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_run_id uuid NOT NULL REFERENCES public.practice_drill_runs(id),
  rep_number integer NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);


CREATE INDEX idx_practice_sessions_user ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_user_started ON public.practice_sessions(user_id, started_at DESC);
CREATE INDEX idx_practice_sessions_analysis_issue ON public.practice_sessions(analysis_issue_id);

CREATE INDEX idx_practice_drill_runs_session ON public.practice_drill_runs(session_id);
CREATE INDEX idx_practice_drill_runs_session_order ON public.practice_drill_runs(session_id, order_index);
CREATE INDEX idx_practice_drill_runs_drill ON public.practice_drill_runs(drill_id);

CREATE INDEX idx_practice_reps_drill_run ON public.practice_reps(drill_run_id);
CREATE UNIQUE INDEX idx_practice_reps_unique_rep ON public.practice_reps(drill_run_id, rep_number);