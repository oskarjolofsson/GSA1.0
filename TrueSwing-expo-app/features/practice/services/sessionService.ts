import { apiClient } from 'lib/apiClient';
import type { PracticeSession } from '../types/Session';
import type { DrillRun } from 'features/drill/types/DrillRun';

export async function startPracticeSession(analysisIssueId: string) {
    return apiClient.post<PracticeSession>('/api/v1/practice/sessions/start/', {
        analysis_issue_id: analysisIssueId,
    });
}

export async function endPracticeSession(sessionId: string) {
    return apiClient.post(`/api/v1/practice/sessions/${sessionId}/complete/`);
}

export async function getPracticeSessionById(sessionId: string): Promise<PracticeSession> {
    return apiClient.get<PracticeSession>(`/api/v1/practice/sessions/${sessionId}/`);
}

export async function getPracticeSessionResults(sessionId: string): Promise<DrillRun[]> {
    return apiClient.get<DrillRun[]>(`/api/v1/practice/sessions/${sessionId}/results/`);
}
