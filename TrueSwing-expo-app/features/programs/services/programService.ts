import { apiClient } from "lib/apiClient";
import type { Program, ProgramStep, StepAdvance, CompleteStepBody } from "../types";

const BASE = "/api/v1/programs";

// ---- 5-minute in-memory cache ----
// Avoids refetching a program/next-step on every issue switch or home focus.
// Invalidated whenever a step is completed (the program then changes).

const TTL_MS = 5 * 60 * 1000;

type Entry<T> = { value: T; ts: number };

// Keyed by issue_id (NOT analysis_issue_id) so it works for every source — AI,
// coach, and browse. Every program carries an issue_id.
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
 * Synchronous cache peek used to seed the hook on issue switch, so a recently
 * loaded program renders instantly without a loading flash. Returns null unless
 * both the active program and (when present) its next step are fresh.
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

/** The user's active program for an issue (any source), or null if none yet. */
export async function getActiveProgramByIssue(issueId: string): Promise<Program | null> {
    const cached = activeCache.get(issueId);
    if (fresh(cached)) return cached.value;
    const value = await apiClient.get<Program | null>(`${BASE}/active/?issue_id=${issueId}`);
    activeCache.set(issueId, { value, ts: Date.now() });
    return value;
}

/**
 * Create (or fetch the existing) active program for an AI-analysed issue. Keeps
 * the analysis_issue_id provenance (history + AI-retest linkage). Premium-gated.
 */
export async function generateProgram(analysisIssueId: string): Promise<Program> {
    const program = await apiClient.post<Program>(`${BASE}/generate/`, {
        analysis_issue_id: analysisIssueId,
    });
    if (program.issue_id) activeCache.set(program.issue_id, { value: program, ts: Date.now() });
    return program;
}

/**
 * Create (or fetch the existing) active program directly from an issue id — the
 * coach-feedback and browse paths, which have no source analysis. Premium-gated.
 */
export async function generateProgramFromIssue(issueId: string): Promise<Program> {
    const program = await apiClient.post<Program>(`${BASE}/generate/`, {
        issue_id: issueId,
    });
    activeCache.set(issueId, { value: program, ts: Date.now() });
    return program;
}

/** The next session to do, scheduled on demand. */
export async function getNextStep(programId: string): Promise<ProgramStep | null> {
    const cached = nextStepCache.get(programId);
    if (fresh(cached)) return cached.value;
    const value = await apiClient.get<ProgramStep | null>(`${BASE}/${programId}/next-step/`);
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
        `${BASE}/${programId}/steps/${stepId}/complete/`,
        body
    );
    // The program changed — drop caches so home reloads fresh state.
    clearProgramCache();
    return result;
}
