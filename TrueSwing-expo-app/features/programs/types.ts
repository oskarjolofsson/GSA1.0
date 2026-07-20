import type { Schemas } from 'lib/api/types';

// Program types. Structural fields are derived from the backend OpenAPI schema
// (lib/api/schema.d.ts); a few fields the backend types loosely (prescription is
// an untyped dict, session_type/status/grade are bare strings) are overridden
// with the app's unions/shapes so consumers keep their ergonomics. Regenerate
// the schema with `npm run gen:api-types`.

export type SessionType = 'range' | 'play' | 'retest';
export type DrillGradeValue = 'rough' | 'ok' | 'dialed';

// Prescription shape varies by session_type; the backend serializes it as an
// untyped object, so this stays hand-written.
//   range:  { drill_ids, num_blocks, cue }
//   play:   { holes, focus }
//   retest: { instruction }
export interface Prescription {
  drill_ids?: string[];
  num_blocks?: number;
  cue?: string | null;
  holes?: number;
  focus?: string;
  instruction?: string;
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

export type DrillGrade = Omit<Schemas['DrillGrade'], 'grade'> & {
  grade: DrillGradeValue;
};

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
}
