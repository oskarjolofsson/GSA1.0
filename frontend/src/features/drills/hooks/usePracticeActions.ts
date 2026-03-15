import { useCallback, useMemo, useState } from "react";

// Custom 
import { startDrillRun, startPracticeSession, endDrillRun, endPracticeSession, getPracticeSessionResults, getPracticeSessionById as getPracticeSessionByIdRequest } from "../services/practiceService";
import { DrillRun, PracticeSession } from "../types";

interface PracticeResultsActions {
    startSession: (analysisIssueId: string | undefined | null) => Promise<PracticeSession>;
    endSession: (sessionId: string) => Promise<void>;
    startDrill: (sessionId: string, drillId: string) => Promise<DrillRun>;
    endDrill: (drillRun: DrillRun) => Promise<void>;
    getResults: (sessionId: string) => Promise<void>;
    getPracticeSessionById: (sessionId: string) => Promise<void>;
}

interface PracticeResultsState {
    loading: boolean;
    error: string | null;
}

interface PracticeResultsValues {
    PracticeSession: PracticeSession | null;
    DrillRuns: DrillRun[];
}

interface UsePracticeResultsReturn {
    actions: PracticeResultsActions;
    state: PracticeResultsState;
    values: PracticeResultsValues;
}

const toErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function usePracticeActions(): UsePracticeResultsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
    const [drillRuns, setDrillRuns] = useState<DrillRun[]>([]);

    const startSession = useCallback(async (analysisIssueId: string | undefined | null) => {
        try {
            setLoading(true);
            setError(null);
            if (!analysisIssueId) throw new Error("You dont have access to these drills. Please try again later");
            const newPracticeSession: PracticeSession = await startPracticeSession(analysisIssueId);
            setPracticeSession(newPracticeSession);
            return newPracticeSession;
        } catch (err) {
            setError(toErrorMessage(err, "Failed to start practice session"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const endSession = useCallback(async (sessionId: string) => {
        try {
            setLoading(true);
            setError(null);
            await endPracticeSession(sessionId);
            setPracticeSession(null);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to end practice session"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const startDrill = useCallback(async (sessionId: string, drillId: string) => {
        try {
            setLoading(true);
            setError(null);
            const drillRun: DrillRun = await startDrillRun(sessionId, drillId);
            setDrillRuns((prev) => [...prev, drillRun]);
            return drillRun;
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
            await endDrillRun(drillRun);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to end drill run"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getResults = useCallback(async (sessionId: string) => {
        try {
            setLoading(true);
            setError(null);
            const results: DrillRun[] = await getPracticeSessionResults(sessionId);
            setDrillRuns(results);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to get practice session results"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getPracticeSessionById = useCallback(async (sessionId: string) => {
        try {
            setLoading(true);
            setError(null);
            const session: PracticeSession = await getPracticeSessionByIdRequest(sessionId);
            setPracticeSession(session);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to get practice session"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const actions = useMemo(
        () => ({
            startSession,
            endSession,
            startDrill,
            endDrill,
            getResults,
            getPracticeSessionById
        }),
        [startSession, endSession, startDrill, endDrill, getResults, getPracticeSessionById],
    );


    return {
        actions,
        state: {
            loading: loading,
            error: error
        },
        values: {
            PracticeSession: practiceSession,
            DrillRuns: drillRuns
        }
    };
}