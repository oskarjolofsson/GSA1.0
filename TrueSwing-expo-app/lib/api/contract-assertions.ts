/**
 * Compile-time drift tripwire: no runtime output and no tests, it exists so `tsc --noEmit`
 * fails when the backend OpenAPI schema drifts from the shapes this app overrides.
 *
 * Directly-aliased types need no assertion -- tsc already checks them at every consumer. The
 * value is in the types that do not alias 1:1, where an `Omit<>` could silently stop
 * protecting anything after a rename.
 *
 * Regenerate the schema with `npm run gen:api-types` before trusting a green run.
 */

import type { Schemas } from 'lib/api/types';
import type { Program, ProgramStep, StepAdvance, CompleteStepBody } from 'features/programs/types';

type Assert<_T extends true> = true;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
// Object A is structurally assignable to B (tuple wrap avoids union distribution).
type Assignable<A, B> = [A] extends [B] ? true : false;

// --- overridden keys must still exist on the backend schema ---
export type _StepHasSessionType = Assert<HasKey<Schemas['ProgramStepResponse'], 'session_type'>>;
export type _StepHasPrescription = Assert<HasKey<Schemas['ProgramStepResponse'], 'prescription'>>;
export type _StepHasStatus = Assert<HasKey<Schemas['ProgramStepResponse'], 'status'>>;
export type _StepHasDrills = Assert<HasKey<Schemas['ProgramStepResponse'], 'drills'>>;
export type _ProgHasStatus = Assert<HasKey<Schemas['ProgramResponse'], 'status'>>;
export type _ProgHasSteps = Assert<HasKey<Schemas['ProgramResponse'], 'steps'>>;
export type _GradeHasGrade = Assert<HasKey<Schemas['DrillGrade'], 'grade'>>;
export type _CompleteHasGrades = Assert<HasKey<Schemas['CompleteStepRequest'], 'grades'>>;
export type _AdvanceHasCompleted = Assert<HasKey<Schemas['StepAdvanceResponse'], 'completed_step'>>;
export type _AdvanceHasNext = Assert<HasKey<Schemas['StepAdvanceResponse'], 'next_step'>>;

// --- shared (non-overridden) fields must stay assignable from the backend ---
export type _ProgSharedInSync = Assert<
  Assignable<
    Omit<Schemas['ProgramResponse'], 'status' | 'steps'>,
    Omit<Program, 'status' | 'steps'>
  >
>;
export type _StepSharedInSync = Assert<
  Assignable<
    Omit<Schemas['ProgramStepResponse'], 'session_type' | 'prescription' | 'status' | 'drills'>,
    Omit<ProgramStep, 'session_type' | 'prescription' | 'status' | 'drills'>
  >
>;
export type _AdvanceSharedInSync = Assert<
  Assignable<
    Omit<Schemas['StepAdvanceResponse'], 'completed_step' | 'next_step'>,
    Omit<StepAdvance, 'completed_step' | 'next_step'>
  >
>;
// CompleteStepBody keeps practice_session_id from the backend verbatim.
export type _CompleteSharedInSync = Assert<
  Assignable<
    Pick<Schemas['CompleteStepRequest'], 'practice_session_id'>,
    Pick<CompleteStepBody, 'practice_session_id'>
  >
>;
