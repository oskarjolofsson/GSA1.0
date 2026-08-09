import type { Schemas } from 'lib/api/types';

// Program types. Structural fields are derived from the backend OpenAPI schema
// (lib/api/schema.d.ts); a few fields the backend types loosely (prescription is
// an untyped dict, session_type/status/grade are bare strings) are overridden
// with the app's unions/shapes so consumers keep their ergonomics. Regenerate
// the schema with `npm run gen:api-types`.

// 'range' is the only type a program step can have — 'play' left the engine when
// rounds became a user-level activity, and 'retest' was backfilled away entirely.
// 'play' stays in the union because practice sessions still use it for a round.
export type SessionType = 'range' | 'play';
export type DrillGradeValue = 'rough' | 'ok' | 'dialed';

// The backend serializes prescription as an untyped object, so this stays
// hand-written. Only one shape exists now:
//   range: { drill_ids, num_blocks, cue }
export interface Prescription {
  drill_ids?: string[];
  num_blocks?: number;
  cue?: string | null;
}

export type StepDrill = Schemas['StepDrillResponse'];

export type ProgramStep = Omit<
  Schemas['ProgramStepResponse'],
  'session_type' | 'prescription' | 'status' | 'drills'
> & {
  session_type: SessionType;
  prescription: Prescription;
  status: 'pending' | 'completed' | 'skipped';
  drills: StepDrill[];
};

export type Program = Omit<Schemas['ProgramResponse'], 'status' | 'steps'> & {
  status: 'active' | 'completed' | 'abandoned';
  steps: ProgramStep[];
};

/**
 * One program as GET /programs/ returns it: no step history, but the next
 * session resolved inline so the home screen renders from a single request.
 *
 * HAND-WRITTEN ON PURPOSE, FOR NOW. `Schemas['ProgramSummaryResponse']` does not
 * exist until someone runs `npm run gen:api-types` against a backend serving the
 * new endpoint. Swap the structural fields over to the generated type once it
 * does — that is what makes a renamed field fail at compile time instead of at
 * runtime.
 */
export interface ProgramSummary {
  id: string;
  user_id: string;
  analysis_issue_id: string | null;
  issue_id: string | null;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  grooved_count: number;
  total_drills: number;
  /** Taxonomy area key, e.g. 'PUTTING'. Frozen at creation, so it can lag the
   *  issue if an admin re-files it — see the column comment on Program.area. */
  area: string | null;
  /** Which of the two per-area slots this program holds (0 or 1). */
  slot: number;
  next_step: ProgramStep | null;
}

/**
 * How one drill block went. Exactly one of the two shapes, never both.
 *
 * A feel drill reports `grade` — the golfer's rough/ok/dialed tap IS the measurement.
 * A scored drill reports `metric_value`, the raw number, and the server grades it against
 * the drill's current thresholds. The union is what stops a caller sending a grade it
 * computed itself from a metric: `grade_at` is admin-editable, so this build's idea of
 * "dialed" goes stale the moment a drill is retuned.
 */
export type DrillGrade =
  | (Omit<Schemas['DrillGrade'], 'grade' | 'metric_value'> & {
      grade: DrillGradeValue;
      metric_value?: never;
    })
  | (Omit<Schemas['DrillGrade'], 'grade' | 'metric_value'> & {
      grade?: never;
      metric_value: number;
    });

// `grades` has a server-side default ([]), so the client may omit it even
// though OpenAPI marks it required; override to optional and use the app's
// DrillGrade (typed `grade`).
export type CompleteStepBody = Omit<Schemas['CompleteStepRequest'], 'grades'> & {
  grades?: DrillGrade[];
};

export type StepAdvance = Omit<Schemas['StepAdvanceResponse'], 'completed_step' | 'next_step'> & {
  completed_step: ProgramStep;
  next_step: ProgramStep | null;
};

// Program context threaded into the practice flow when a range session is
// launched from a program (vs. the legacy issue-driven reel path).
export interface ProgramContext {
  programId: string;
  stepId: string;
  drillIds: string[];
  /**
   * `grooved_count` as it stood when this session started, so the completion screen can
   * show what moved instead of only a total. `StepAdvance` returns the count after, and
   * the difference is the honest "+1 · Gate Drill filled in". Captured here because by
   * the time the session ends the before-value is gone.
   */
  groovedBefore: number;
}
