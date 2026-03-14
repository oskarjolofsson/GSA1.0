import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Drill, DrillRun, PracticeSession } from '../types';
import { usePracticeResults } from './usePracticeActions';
import { Issue } from '@/features/issues/types';



const REPS_PER_DRILL = 12;

interface ActiveDrillProgress {
    succeeded: number;
    failed: number;
    total: number;
}

interface UseActiveDrillReturn {
    activeDrill: Drill | null;
    progress: ActiveDrillProgress;
    remainingDrillsCount: number;
    handleSuccess: () => void;
    handleFailure: () => void;
    loading: boolean;
    error: string | null;
}

export function useActiveDrill(drills: Drill[], issue: Issue | null): UseActiveDrillReturn {
    const navigate = useNavigate();
    const { actions, state } = usePracticeResults();
    const { startSession, startDrill, endDrill, endSession } = actions;

    const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
    const [currentDrillRun, setCurrentDrillRun] = useState<DrillRun | null>(null);
    const [currentPracticeSession, setCurrentPracticeSession] = useState<PracticeSession | null>(null);
    const hasInitializedRef = useRef(false);

    const activeDrill = currentDrillIndex < drills.length ? drills[currentDrillIndex] : null;
    const succeeded = currentDrillRun?.successful_reps ?? 0;
    const failed = currentDrillRun?.failed_reps ?? 0;
    const totalReps = succeeded + failed;
    const isDrillComplete = totalReps === REPS_PER_DRILL;

    useEffect(() => {
        hasInitializedRef.current = false;
        setCurrentDrillIndex(0);
        setCurrentDrillRun(null);
        setCurrentPracticeSession(null);
    }, [issue?.id, drills]);

    useEffect(() => {
        let isMounted = true;

        const initializePractice = async () => {

            try {
                hasInitializedRef.current = true;
                const session = await startSession(issue?.analysis_id);
                if (!isMounted) return;

                setCurrentPracticeSession(session);
                const firstDrillRun = await startDrill(session.id, drills[0].id);


                if (!isMounted) return;

                setCurrentDrillRun(firstDrillRun);
            } catch (err) {
                console.error('Error initializing practice flow:', err);
            }
        };

        initializePractice();

        return () => {
            isMounted = false;
        };
    }, [currentPracticeSession, drills, issue?.id, startDrill, startSession]);

    const moveToNextDrill = useCallback(async () => {
        if (!currentDrillRun || !currentPracticeSession) {
            return;
        }

        const nextIndex = currentDrillIndex + 1;

        await endDrill(currentDrillRun.id);

        if (nextIndex >= drills.length) {
            await endSession(currentPracticeSession.id);
            navigate(`/dashboard/drills/results?issueID=${issue?.id}`);
            return;
        }

        const nextDrillRun = await startDrill(currentPracticeSession.id, drills[nextIndex].id);
        setCurrentDrillRun(nextDrillRun);
        setCurrentDrillIndex(nextIndex);
    }, [currentDrillIndex, currentDrillRun, currentPracticeSession, drills, endDrill, endSession, issue?.id, navigate, startDrill]);

    const handleRep = useCallback(async (repType: 'successful_reps' | 'failed_reps') => {
        if (isDrillComplete || !currentDrillRun) {
            return;
        }

        const updatedDrillRun = {
            ...currentDrillRun,
            [repType]: currentDrillRun[repType] + 1,
        };

        setCurrentDrillRun(updatedDrillRun);

        const updatedTotalReps = updatedDrillRun.successful_reps + updatedDrillRun.failed_reps;
        if (updatedTotalReps === REPS_PER_DRILL) {
            await moveToNextDrill();
        }
    }, [currentDrillRun, isDrillComplete, moveToNextDrill]);

    const handleSuccess = useCallback(() => {
        void handleRep('successful_reps');
        console.log('Handled success rep. Current drill run state:', currentDrillRun);
    }, [handleRep]);

    const handleFailure = useCallback(() => {
        void handleRep('failed_reps');
    }, [handleRep]);

    const remainingDrillsCount = Math.max(0, drills.length - currentDrillIndex - 1);

    return {
        activeDrill,
        progress: {
            succeeded,
            failed,
            total: REPS_PER_DRILL,
        },
        remainingDrillsCount,
        handleSuccess,
        handleFailure,
        loading: state.loading,
        error: state.error,
    };
}
