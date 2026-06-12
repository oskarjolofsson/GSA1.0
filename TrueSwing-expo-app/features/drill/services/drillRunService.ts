import { apiClient } from 'lib/apiClient';
import type { DrillRun } from '../types/DrillRun';

export async function startDrillRun(sessionId: string, drillId: string) {
    return apiClient.post<DrillRun>(`/api/v1/practice/sessions/${sessionId}/drills/start/`, {
        drill_id: drillId,
    });
}

export async function endDrillRun(drillRun: DrillRun) {
    return apiClient.post(`/api/v1/practice/drill-runs/complete/`, drillRun);
}
