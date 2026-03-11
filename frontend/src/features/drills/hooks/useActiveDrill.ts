import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Drill } from '../types';

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
}

export function useActiveDrill(drills: Drill[], issueId: string): UseActiveDrillReturn {
    const navigate = useNavigate();
    const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
    const [succeeded, setSucceeded] = useState<number>(0);
    const [failed, setFailed] = useState<number>(0);

    const activeDrill = currentDrillIndex < drills.length ? drills[currentDrillIndex] : null;
    const totalReps = succeeded + failed;
    const isDrillComplete = totalReps === REPS_PER_DRILL;

    const moveToNextDrill = useCallback(() => {
        const nextIndex = currentDrillIndex + 1;

        if (nextIndex >= drills.length) {
            // All drills completed, navigate to results
            navigate(`/dashboard/drills/results?issueID=${issueId}`);
        } else {
            // Move to next drill and reset counters
            setCurrentDrillIndex(nextIndex);
            setSucceeded(0);
            setFailed(0);
        }
    }, [currentDrillIndex, drills.length, issueId, navigate]);

    const handleSuccess = useCallback(() => {
        if (isDrillComplete) return; // Already at 12 reps, ignore further clicks

        const newSucceeded = succeeded + 1;
        setSucceeded(newSucceeded);

        if (newSucceeded + failed === REPS_PER_DRILL) {
            moveToNextDrill();
        }
    }, [succeeded, failed, isDrillComplete, moveToNextDrill]);

    const handleFailure = useCallback(() => {
        if (isDrillComplete) return; // Already at 12 reps, ignore further clicks

        const newFailed = failed + 1;
        setFailed(newFailed);

        if (succeeded + newFailed === REPS_PER_DRILL) {
            moveToNextDrill();
        }
    }, [succeeded, failed, isDrillComplete, moveToNextDrill]);

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
    };
}
