import { useCallback, useState } from "react";
import { startDrillRun as startDrillRunRequest, endDrillRun as endDrillRunRequest } from "../services/drillRunService";
import type { DrillRun } from "../types/DrillRun";

interface UseDrillRunActionsReturn {
    loading: boolean;
    error: string | null;
    startDrill: (sessionId: string, drillId: string) => Promise<DrillRun>;
    endDrill: (drillRun: DrillRun) => Promise<void>;
}

const toErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

export function useDrillRunActions(): UseDrillRunActionsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startDrill = useCallback(async (sessionId: string, drillId: string) => {
        try {
            setLoading(true);
            setError(null);
            return await startDrillRunRequest(sessionId, drillId);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to start drill run"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const endDrill = useCallback(async (drillRun: DrillRun) => {
        try {
            setLoading(true);
            setError(null);
            await endDrillRunRequest(drillRun);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to end drill run"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, startDrill, endDrill };
}
