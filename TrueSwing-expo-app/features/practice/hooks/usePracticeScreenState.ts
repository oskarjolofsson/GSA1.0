import { useState, useEffect, useCallback, useRef } from 'react';
import { DrillService } from 'features/drill/services/drillService';
import { useDrillRunActions } from 'features/drill/hooks/useDrillRunActions';
import { useSessionActions } from './useSessionActions';
import type { Issue } from 'features/issues/types';
import type { Drill } from 'features/drill/types/Drill';
import type { DrillRun } from 'features/drill/types/DrillRun';
import type { PracticeSession } from '../types/Session';

const REPS_PER_DRILL = 12;

interface UsePracticeDrillsReturn {
    activeDrill: Drill | null;
    remainingDrillsCount: number;
    practiceReady: boolean;
    progress: {
        succeeded: number;
        failed: number;
        total: number;
    };
    handleSuccess: () => void;
    handleFailure: () => void;
    loading: boolean;
    error: string | null;
}

export function usePracticeScreenState(
        issue: Issue,
        session: PracticeSession | null,
        onSessionCompleted: () => void
    ): UsePracticeDrillsReturn
{
    const { startDrill, endDrill, loading: drillRunLoading, error: drillRunError } = useDrillRunActions();
    const { endSession, loading: sessionLoading, error: sessionError } = useSessionActions();

    const [allDrills, setDrills] = useState<Drill[]>([]);
    const [screenLoading, setScreenLoading] = useState<boolean>(true);
    const [screenError, setScreenError] = useState<string | null>(null);

    const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
    const [currentDrillRun, setCurrentDrillRun] = useState<DrillRun | null>(null);
    const [flowError, setFlowError] = useState<string | null>(null);
    const hasInitializedRef = useRef(false);
    const lastCompletedRunIdRef = useRef<string | null>(null);

    const drillService = new DrillService();

    const activeDrill = currentDrillIndex < allDrills.length ? allDrills[currentDrillIndex] : null;
    const succeeded = currentDrillRun?.successful_reps ?? 0;
    const failed = currentDrillRun?.failed_reps ?? 0;

    useEffect(() => {
        const fetchIssueAndDrills = async () => {
            if (!issue) {
                setDrills([]);
                setScreenLoading(false);
                return;
            }

            try {
                setScreenLoading(true);
                setScreenError(null);
                const fetchedDrills = await drillService.getDrillsByIssue(issue.id);
                setDrills(fetchedDrills);
            } catch (err) {
                console.error('Error fetching drills or issue:', err);
                setScreenError(err instanceof Error ? err.message : 'Internal error occurred while loading drills');
                setDrills([]);
            } finally {
                setScreenLoading(false);
            }
        };

        fetchIssueAndDrills();

    }, [issue]);

    useEffect(() => {
        hasInitializedRef.current = false;
        setCurrentDrillIndex(0);
        setCurrentDrillRun(null);
        setFlowError(null);
        lastCompletedRunIdRef.current = null;
    }, [issue, session]);

    useEffect(() => {
        let isMounted = true;

        const initializePractice = async () => {
            if (!issue) return;

            if (!session) {
                hasInitializedRef.current = true;
                setFlowError('Practice session is missing. Please go back and start practice again.');
                return;
            }

            if (allDrills.length === 0 || hasInitializedRef.current) return;

            try {
                hasInitializedRef.current = true;
                setFlowError(null);
                const firstDrillRun = await startDrill(session.id, allDrills[0].id);
                if (!isMounted) return;
                setCurrentDrillRun(firstDrillRun);
            } catch (err) {
                if (!isMounted) return;
                hasInitializedRef.current = false;
                setFlowError(err instanceof Error ? err.message : 'Failed to initialize practice');
            }
        };

        initializePractice();

        return () => {
            isMounted = false;
        };
    }, [issue, session, allDrills.length, startDrill]);

    const moveToNextDrill = useCallback(async (completedDrillRun: DrillRun) => {
        if (!session) return;
        const nextIndex = currentDrillIndex + 1;
        await endDrill(completedDrillRun);

        if (nextIndex >= allDrills.length) {
            await endSession(session.id);
            onSessionCompleted();
            return;
        }

        const nextDrillRun = await startDrill(session.id, allDrills[nextIndex].id);
        setCurrentDrillRun(nextDrillRun);
        setCurrentDrillIndex(nextIndex);
    }, [allDrills, currentDrillIndex, endDrill, endSession, session, startDrill, onSessionCompleted]);

    const handleRep = useCallback((repType: 'successful_reps' | 'failed_reps') => {
        if (!session || !currentDrillRun) return;

        setCurrentDrillRun((previousDrillRun) => {
            if (!previousDrillRun) return previousDrillRun;

            const currentTotalReps = previousDrillRun.successful_reps + previousDrillRun.failed_reps;
            if (currentTotalReps >= REPS_PER_DRILL) return previousDrillRun;

            return {
                ...previousDrillRun,
                [repType]: previousDrillRun[repType] + 1,
            };
        });
    }, [currentDrillRun, session]);

    useEffect(() => {
        if (!currentDrillRun || !session) return;

        const updatedTotalReps = currentDrillRun.successful_reps + currentDrillRun.failed_reps;
        if (updatedTotalReps !== REPS_PER_DRILL) return;

        if (lastCompletedRunIdRef.current === currentDrillRun.id) return;

        lastCompletedRunIdRef.current = currentDrillRun.id;
        void moveToNextDrill(currentDrillRun);
    }, [currentDrillRun, session, moveToNextDrill]);

    const handleSuccess = useCallback(() => handleRep('successful_reps'), [handleRep]);
    const handleFailure = useCallback(() => handleRep('failed_reps'), [handleRep]);

    const remainingDrillsCount = Math.max(0, allDrills.length - currentDrillIndex - 1);
    const practiceReady = Boolean(session && currentDrillRun);
    const isInitializingPractice = !screenLoading && allDrills.length > 0 && !flowError && !practiceReady;

    return {
        activeDrill,
        remainingDrillsCount,
        practiceReady,
        progress: {
            succeeded,
            failed,
            total: REPS_PER_DRILL,
        },
        handleSuccess,
        handleFailure,
        loading: screenLoading || drillRunLoading || sessionLoading || isInitializingPractice,
        error: screenError || flowError || drillRunError || sessionError,
    };
}
