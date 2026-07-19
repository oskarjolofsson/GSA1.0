import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { DrillRun } from '../types/DrillRun';

export async function startDrillRun(sessionId: string, drillId: string) {
    return apiClient.post<DrillRun>(routes.practice.sessionDrillsStart(sessionId), {
        drill_id: drillId,
    });
}

export async function endDrillRun(drillRun: DrillRun) {
    return apiClient.post(routes.practice.drillRunsComplete, drillRun);
}
