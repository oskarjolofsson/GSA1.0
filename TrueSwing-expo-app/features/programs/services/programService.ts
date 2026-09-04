import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { Program, ProgramStep, ProgramSummary, StepAdvance, CompleteStepBody } from '../types';

// ---- 5-minute in-memory cache ----
// Scoped to the per-issue reads used by the analysis reel (getActiveProgramByIssue +
// getNextStep). Invalidated whenever a step is completed. Home does not go through it.

const TTL_MS = 5 * 60 * 1000;

type Entry<T> = { value: T; ts: number };

// Keyed by issue_id (NOT analysis_issue_id) so it works for every source. Every program
// carries an issue_id.
const activeCache = new Map<string, Entry<Program | null>>(); // key: issueId
const nextStepCache = new Map<string, Entry<ProgramStep | null>>(); // key: programId

function fresh<T>(entry: Entry<T> | undefined): entry is Entry<T> {
  return !!entry && Date.now() - entry.ts < TTL_MS;
}

/** Clear all cached program data (call after anything that mutates a program). */
export function clearProgramCache(): void {
  activeCache.clear();
  nextStepCache.clear();
}

/**
 * Synchronous cache peek that seeds the hook on issue switch, avoiding a loading flash.
 * Returns null unless both the active program and its next step are fresh.
 */
export function peekProgramSession(
  issueId: string
): { program: Program | null; nextStep: ProgramStep | null } | null {
  const a = activeCache.get(issueId);
  if (!fresh(a)) return null;
  if (!a.value) return { program: null, nextStep: null };
  const n = nextStepCache.get(a.value.id);
  if (!fresh(n)) return null;
  return { program: a.value, nextStep: n.value };
}

/**
 * Every program the golfer currently has open, each with its next session inline.
 *
 * Deliberately not cached, unlike the rest of this file: one call covers every area, so
 * switching areas is a local filter. `usePrograms` refetches on focus.
 */
export async function listPrograms(): Promise<ProgramSummary[]> {
  return apiClient.get<ProgramSummary[]>(routes.programs.list);
}

/** The user's active program for an issue (any source), or null if none yet. */
export async function getActiveProgramByIssue(issueId: string): Promise<Program | null> {
  const cached = activeCache.get(issueId);
  if (fresh(cached)) return cached.value;
  const value = await apiClient.get<Program | null>(routes.programs.active(issueId));
  activeCache.set(issueId, { value, ts: Date.now() });
  return value;
}

/**
 * Create (or fetch the existing) active program for an AI-analysed issue, keeping the
 * analysis_issue_id provenance. Premium-gated.
 */
export async function generateProgram(analysisIssueId: string): Promise<Program> {
  const program = await apiClient.post<Program>(routes.programs.generate, {
    analysis_issue_id: analysisIssueId,
  });
  if (program.issue_id) activeCache.set(program.issue_id, { value: program, ts: Date.now() });
  return program;
}

/**
 * Create (or fetch the existing) active program from an issue id -- the coach-feedback and
 * browse paths, which have no source analysis. Premium-gated.
 */
export async function generateProgramFromIssue(issueId: string): Promise<Program> {
  const program = await apiClient.post<Program>(routes.programs.generate, {
    issue_id: issueId,
  });
  activeCache.set(issueId, { value: program, ts: Date.now() });
  return program;
}

/**
 * Remove a browse/coach focus. A coach-authored (custom) issue is deleted outright; a
 * global catalog issue keeps the shared row and only the user's programs go.
 */
export async function removeFocus(issueId: string): Promise<void> {
  await apiClient.delete<void>(routes.programs.byIssue(issueId));
  clearProgramCache();
}

/** The next session to do, scheduled on demand. */
export async function getNextStep(programId: string): Promise<ProgramStep | null> {
  const cached = nextStepCache.get(programId);
  if (fresh(cached)) return cached.value;
  const value = await apiClient.get<ProgramStep | null>(routes.programs.nextStep(programId));
  nextStepCache.set(programId, { value, ts: Date.now() });
  return value;
}

/** Mark a step complete, submitting per-drill grades, and advance the program. */
export async function completeStep(
  programId: string,
  stepId: string,
  body: CompleteStepBody
): Promise<StepAdvance> {
  const result = await apiClient.post<StepAdvance>(
    routes.programs.stepComplete(programId, stepId),
    body
  );
  clearProgramCache();
  return result;
}
