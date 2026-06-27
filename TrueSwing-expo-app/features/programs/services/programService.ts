import { apiClient } from "lib/apiClient";
import type { Program, ProgramStep, StepAdvance, CompleteStepBody } from "../types";

const BASE = "/api/v1/programs";

/** The user's active program for an issue, or null if none exists yet. */
export async function getActiveProgram(analysisIssueId: string): Promise<Program | null> {
    return apiClient.get<Program | null>(`${BASE}/active/?analysis_issue_id=${analysisIssueId}`);
}

/** Create (or fetch the existing) active program for an issue. Premium-gated. */
export async function generateProgram(analysisIssueId: string): Promise<Program> {
    return apiClient.post<Program>(`${BASE}/generate/`, { analysis_issue_id: analysisIssueId });
}

/** The next session to do, scheduled on demand. */
export async function getNextStep(programId: string): Promise<ProgramStep | null> {
    return apiClient.get<ProgramStep | null>(`${BASE}/${programId}/next-step/`);
}

/** Mark a step complete, submitting per-drill grades, and advance the program. */
export async function completeStep(
    programId: string,
    stepId: string,
    body: CompleteStepBody
): Promise<StepAdvance> {
    return apiClient.post<StepAdvance>(`${BASE}/${programId}/steps/${stepId}/complete/`, body);
}
