import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { PracticeSession } from '../types/Session';
import type { DrillRun } from 'features/drill/types/DrillRun';

type StartSessionOptions = {
    session_type?: 'range' | 'play' | 'retest';
    notes?: string | null;
};

export async function startPracticeSession(analysisIssueId: string | null, opts: StartSessionOptions = {}) {
    return apiClient.post<PracticeSession>(routes.practice.sessionsStart, {
        analysis_issue_id: analysisIssueId,
        session_type: opts.session_type,
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
