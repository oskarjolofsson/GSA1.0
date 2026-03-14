import { useState } from "react";

// Custom 
import { startDrillRun, startPracticeSession, endDrillRun, endPracticeSession } from "../services/practiceService";
import { DrillRun, PracticeSession } from "../types";


interface PracticeResultsActions {
    startSession: (analysisIssueId: string) => Promise<void>;
    endSession: (sessionId: string) => Promise<void>;
    startDrill: (practiceSession: PracticeSession, drillId: string) => Promise<void>;
    endDrill: (drillRun: DrillRun) => Promise<void>;
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

export function usePracticeResults(analysisIssueId: string): UsePracticeResultsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
    const [drillRuns, setDrillRuns] = useState<DrillRun[]>([]);

    const withActionState =
        <TArgs extends unknown[]>(
            logLabel: string,
            errorMessage: string,
            handler: (...args: TArgs) => Promise<void>,
        ) =>
            async (...args: TArgs) => {
                try {
                    setLoading(true);
                    setError(null);
                    await handler(...args);
                } catch (err) {
                    console.error(`Error ${logLabel}:`, err);
                    setError(errorMessage);
                } finally {
                    setLoading(false);
                }
            };

    const startSession = withActionState(
        "starting practice session",
        "Failed to start practice session",
        async (sessionAnalysisIssueId: string) => {
            const newPracticeSession: PracticeSession = await startPracticeSession(sessionAnalysisIssueId);
            setPracticeSession(newPracticeSession);
        },
    );

    const endSession = withActionState(
        "ending practice session",
        "Failed to end practice session",
        async (sessionId: string) => {
            await endPracticeSession(sessionId);
            setPracticeSession(null);
        },
    );

    const startDrill = withActionState(
        "starting drill run",
        "Failed to start drill run",
        async (currentPracticeSession: PracticeSession, drillId: string) => {
            const drillRun: DrillRun = await startDrillRun(currentPracticeSession.id, drillId);
            setDrillRuns((prev) => [...prev, drillRun]);
        },
    );

    const endDrill = withActionState(
        "ending drill run",
        "Failed to end drill run",
        async (drillRun: DrillRun) => {
            await endDrillRun(drillRun.id);
        },
    );


    return {
        actions: {
            startSession,
            endSession,
            startDrill,
            endDrill
        },
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