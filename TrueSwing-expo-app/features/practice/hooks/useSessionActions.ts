import { useCallback, useState } from "react";
import {
    startPracticeSession as startPracticeSessionRequest,
    endPracticeSession as endPracticeSessionRequest,
    getPracticeSessionById as getPracticeSessionByIdRequest,
    getPracticeSessionResults,
} from "../services/sessionService";
import type { PracticeSession } from "../types/Session";
import type { DrillRun } from "features/drill/types/DrillRun";

interface UseSessionActionsReturn {
    session: PracticeSession | null;
    drillRuns: DrillRun[];
    loading: boolean;
    error: string | null;
    startSession: (analysisIssueId: string | undefined | null) => Promise<PracticeSession>;
    endSession: (sessionId: string) => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;
    loadResults: (sessionId: string) => Promise<void>;
}

const toErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

export function useSessionActions(): UseSessionActionsReturn {
    const [session, setSession] = useState<PracticeSession | null>(null);
    const [drillRuns, setDrillRuns] = useState<DrillRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startSession = useCallback(async (analysisIssueId: string | undefined | null) => {
        try {
            setLoading(true);
            setError(null);
            if (!analysisIssueId) throw new Error("You dont have access to these drills. Please try again later");
            const newSession = await startPracticeSessionRequest(analysisIssueId);
            setSession(newSession);
            return newSession;
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
            await endPracticeSessionRequest(sessionId);
            setSession(null);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to end practice session"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSession = useCallback(async (sessionId: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetched = await getPracticeSessionByIdRequest(sessionId);
            setSession(fetched);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to get practice session"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadResults = useCallback(async (sessionId: string) => {
        try {
            setLoading(true);
            setError(null);
            const results = await getPracticeSessionResults(sessionId);
            setDrillRuns(results);
        } catch (err) {
            setError(toErrorMessage(err, "Failed to get practice session results"));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { session, drillRuns, loading, error, startSession, endSession, loadSession, loadResults };
}
