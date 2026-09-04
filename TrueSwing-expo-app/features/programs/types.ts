import type { Schemas } from 'lib/api/types';

// Program types. Structural fields derive from the generated OpenAPI schema; fields the
// backend types loosely (prescription, session_type, status, grade) are narrowed here.
// Regenerate with `npm run gen:api-types`.

// A program step is always 'range'. 'play' stays in the union because practice sessions
// still use it for a round.
export type SessionType = 'range' | 'play';
export type DrillGradeValue = 'rough' | 'ok' | 'dialed';

// The backend serializes prescription as an untyped object, so this stays hand-written.
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
 * One program as GET /programs/ returns it: no step history, but the next session inline so
 * home renders from a single request.
 *
 * Hand-written only because `Schemas['ProgramSummaryResponse']` does not exist yet. Swap to
 * the generated type once `npm run gen:api-types` produces it.
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
 * How one drill block went. Exactly one of the two shapes, never both: a feel drill reports
 * `grade`, a scored drill reports the raw `metric_value` for the server to grade. The union
 * is what stops a caller grading a metric itself. See ADR-0020.
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

// `grades` has a server-side default ([]), so the client may omit it even though OpenAPI
// marks it required.
export type CompleteStepBody = Omit<Schemas['CompleteStepRequest'], 'grades'> & {
  grades?: DrillGrade[];
};

export type StepAdvance = Omit<Schemas['StepAdvanceResponse'], 'completed_step' | 'next_step'> & {
  completed_step: ProgramStep;
  next_step: ProgramStep | null;
};

// Threaded into the practice flow when a range session is launched from a program.
export interface ProgramContext {
  programId: string;
  stepId: string;
  drillIds: string[];
  /**
   * `grooved_count` as it stood when this session started. Captured here because by the
   * time the session ends the before-value is gone, and the completion screen diffs it
   * against the count `StepAdvance` returns.
   */
  groovedBefore: number;
}
