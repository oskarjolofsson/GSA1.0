import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { PracticeSession } from '../types/Session';
import type { DrillRun } from 'features/drill/types/DrillRun';

type StartSessionOptions = {
    // Two ids for one concept, and both are load-bearing. `analysis_issue_id` is
    // provenance and is null for custom (coach/browse) issues; `issue_id` is how the
    // server stamps the session with the practised issue's area, which the activity
    // graph reads. Neither replaces the other -- always send what you have.
    issueId?: string | null;
    analysisIssueId?: string | null;
    sessionType?: 'range' | 'play';
    notes?: string | null;
};

export async function startPracticeSession(opts: StartSessionOptions = {}) {
    return apiClient.post<PracticeSession>(routes.practice.sessionsStart, {
        analysis_issue_id: opts.analysisIssueId ?? null,
        issue_id: opts.issueId,
        session_type: opts.sessionType,
        notes: opts.notes,
    });
}

export async function endPracticeSession(sessionId: string) {
    return apiClient.post(routes.practice.sessionComplete(sessionId));
}

export async function getPracticeSessionById(sessionId: string): Promise<PracticeSession> {
    return apiClient.get<PracticeSession>(routes.practice.session(sessionId));
}

export async function getPracticeSessionResults(sessionId: string): Promise<DrillRun[]> {
    return apiClient.get<DrillRun[]>(routes.practice.sessionResults(sessionId));
}
