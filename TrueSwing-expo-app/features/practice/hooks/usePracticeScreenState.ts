import { useState, useEffect, useCallback, useRef } from 'react';
import { DrillService } from 'features/drill/services/drillService';
import { useDrillRunActions } from 'features/drill/hooks/useDrillRunActions';
import { useSessionActions } from './useSessionActions';
import type { Issue } from 'features/issues/types';
import type { Drill } from 'features/drill/types/Drill';
import type { DrillRun } from 'features/drill/types/DrillRun';
import type { PracticeSession } from '../types/Session';
import { feelToOrdinal, type BlockFeel } from '../utils/blockFeel';

interface UsePracticeDrillsReturn {
    activeDrill: Drill | null;
    drillNumber: number;
    totalDrills: number;
    remainingDrillsCount: number;
    practiceReady: boolean;
    completeBlock: (feel: BlockFeel | null) => void;
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

    // Show-up loop: a drill is one focused block. The user hits a block of balls
    // heads-down, then taps once to log how it felt (or skips the rating). No
    // per-shot grading. The optional feel is stored in `successful_reps` as a small
    // ordinal for now (0 = no rating); Phase 2 moves it to a dedicated `feel` column.
    const completeBlock = useCallback((feel: BlockFeel | null) => {
        if (!session || !currentDrillRun) return;
        if (lastCompletedRunIdRef.current === currentDrillRun.id) return;

        lastCompletedRunIdRef.current = currentDrillRun.id;
        const completedRun: DrillRun = {
            ...currentDrillRun,
            successful_reps: feelToOrdinal(feel),
            failed_reps: 0,
        };
        void moveToNextDrill(completedRun);
    }, [currentDrillRun, session, moveToNextDrill]);

    const totalDrills = allDrills.length;
    const drillNumber = Math.min(currentDrillIndex + 1, totalDrills);
    const remainingDrillsCount = Math.max(0, allDrills.length - currentDrillIndex - 1);
    const practiceReady = Boolean(session && currentDrillRun);
    const isInitializingPractice = !screenLoading && allDrills.length > 0 && !flowError && !practiceReady;

    return {
        activeDrill,
        drillNumber,
        totalDrills,
        remainingDrillsCount,
        practiceReady,
        completeBlock,
        loading: screenLoading || drillRunLoading || sessionLoading || isInitializingPractice,
        error: screenError || flowError || drillRunError || sessionError,
    };
}
