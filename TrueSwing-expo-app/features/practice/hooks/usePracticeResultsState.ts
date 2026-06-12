import { useEffect } from "react";
import { useSessionActions } from "./useSessionActions";
import type { DrillRun } from "features/drill/types/DrillRun";
import type { PracticeSession } from "../types/Session";

interface UsePracticeResultsStateReturn {
    PracticeSession: PracticeSession | null;
    DrillRuns: DrillRun[];
    loading: boolean;
    error: string | null;
}

export function usePracticeResultsState({ sessionId }: { sessionId: string | null }): UsePracticeResultsStateReturn {
    const { session, drillRuns, loading, error, loadSession, loadResults } = useSessionActions();

    useEffect(() => {
        const fetchResults = async () => {
            if (!sessionId) return;
            await loadSession(sessionId);
            await loadResults(sessionId);
        };
        fetchResults();
    }, [sessionId, loadSession, loadResults]);

    return {
        PracticeSession: session,
        DrillRuns: drillRuns,
        loading,
        error,
    };
}
