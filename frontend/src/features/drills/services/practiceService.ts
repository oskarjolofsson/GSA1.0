import { apiClient } from '@/lib/apiClient';
import { PracticeSession, DrillRun } from '../types';


export async function startPracticeSession(analysisIssueId: string) {
    return apiClient.post<PracticeSession>('/api/v1/sessions/start', {
        analysis_issue_id: analysisIssueId,
    });
}


export async function endPracticeSession(sessionId: string) {
    return apiClient.post(`/api/v1/sessions/${sessionId}/complete`);
}


export async function startDrillRun(sessionId: string, drillId: string) {
    return apiClient.post<DrillRun>(`/api/v1/sessions/${sessionId}/drills/start`, {
        drill_id: drillId,
    });
}


export async function endDrillRun(drillRunId: string) {
    return apiClient.post(`/api/v1/drill-runs/${drillRunId}/complete`);
}


export async function getPracticeSessionResults(sessionId: string): Promise<DrillRun[]> {
    return apiClient.get<DrillRun[]>(`/api/v1/sessions/${sessionId}/results`);
}