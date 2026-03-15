import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrillService } from '@/features/drills/services/drillService';
import { IssueService }  from '@/features/issues/services/issueService';
import { usePracticeActions } from './usePracticeActions';
import type { Drill, DrillRun, PracticeSession } from '../types';
import type { Issue } from '@/features/issues/types';

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

export function usePracticeScreenState(issueId: string): UsePracticeDrillsReturn {
    const navigate = useNavigate();
    const { actions, state } = usePracticeActions();
    const { startSession, startDrill, endDrill, endSession } = actions;

    const [allDrills, setDrills] = useState<Drill[]>([]);
    const [issue, setIssue] = useState<Issue | null>(null);
    const [screenLoading, setScreenLoading] = useState<boolean>(true);
    const [screenError, setScreenError] = useState<string | null>(null);

    const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
    const [currentDrillRun, setCurrentDrillRun] = useState<DrillRun | null>(null);
    const [currentPracticeSession, setCurrentPracticeSession] = useState<PracticeSession | null>(null);
    const [flowError, setFlowError] = useState<string | null>(null);
    const hasInitializedRef = useRef(false);
    const lastCompletedRunIdRef = useRef<string | null>(null);

    const drillService = new DrillService();
    const issueService = new IssueService();

    const activeDrill = currentDrillIndex < allDrills.length ? allDrills[currentDrillIndex] : null;
    const succeeded = currentDrillRun?.successful_reps ?? 0;
    const failed = currentDrillRun?.failed_reps ?? 0;

    // Fetch issue and all drills for the issue when the component mounts or when the issueId changes
    useEffect(() => {
        const fetchIssueAndDrills = async () => {
            if (!issueId) {
                setDrills([]);
                setIssue(null);
                setScreenLoading(false);
                return;
            }

            try {
                setScreenLoading(true);
                setScreenError(null);
                const fetchedDrills = await drillService.getDrillsByIssue(issueId);
                const fetchedIssue: Issue = await issueService.getIssueById(issueId);
                setDrills(fetchedDrills);
                setIssue(fetchedIssue);
            } catch (err) {
                console.error('Error fetching drills or issue:', err);
                setScreenError(err instanceof Error ? err.message : 'Internal error occurred while loading drills');
                setDrills([]);
                setIssue(null);
            } finally {
                setScreenLoading(false);
            }
        };

        fetchIssueAndDrills();

    }, [issueId]);

    // Reset practice state when issue changes
    useEffect(() => {
        hasInitializedRef.current = false;
        setCurrentDrillIndex(0);
        setCurrentDrillRun(null);
        setCurrentPracticeSession(null);
        setFlowError(null);
        lastCompletedRunIdRef.current = null;
    }, [issue?.id]);

    // Initialize practice session and start first drill when drills are loaded and issue is valid
    useEffect(() => {
        let isMounted = true;

        const initializePractice = async () => {
            if (!issue) {

                return;
            }

            if (!issue.analysis_issue_id) {
                hasInitializedRef.current = true;
                setFlowError('Issue is missing analysis reference. Please refresh or choose another issue.');
                return;
            }

            if (allDrills.length === 0 || currentPracticeSession || hasInitializedRef.current) {
                console.warn('Skipping practice initialization due to missing drills, existing session, or already initialized state. allDrills.length:', allDrills.length, 'currentPracticeSession:', currentPracticeSession, 'hasInitializedRef.current:', hasInitializedRef.current);
                return;
            }

            try {
                hasInitializedRef.current = true;
                setFlowError(null);
                const session = await startSession(issue.analysis_issue_id);
                if (!isMounted) return;
                setCurrentPracticeSession(session);
                console.log('Started practice session:', session);  // Debug log to confirm session creation

                const firstDrillRun = await startDrill(session.id, allDrills[0].id);
                if (!isMounted) return;
                console.log('Started first drill run:', firstDrillRun);  // Debug log to confirm drill run creation

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
    }, [issue?.id, allDrills.length, startDrill, startSession]);

    const moveToNextDrill = useCallback(async (completedDrillRun: DrillRun) => {
        console.log('Attempting to move to next drill. completedDrillRun:', completedDrillRun, 'currentDrillIndex:', currentDrillIndex);  // Debug log to trace drill completion
        if (!currentPracticeSession) return;    // Guard against missing practice session
        const nextIndex = currentDrillIndex + 1;                    // Calculate next drill index
        await endDrill(completedDrillRun);                       // End current drill run before moving to the next one

        if (nextIndex >= allDrills.length) {
            // No more drills, end session and navigate to results
            await endSession(currentPracticeSession.id);
            navigate(`/dashboard/drills/results?sessionId=${currentPracticeSession.id}`);
            return;
        }

        // Start next drill
        const nextDrillRun = await startDrill(currentPracticeSession.id, allDrills[nextIndex].id);
        setCurrentDrillRun(nextDrillRun);
        setCurrentDrillIndex(nextIndex);
    }, [allDrills, currentDrillIndex, currentPracticeSession, endDrill, endSession, navigate, startDrill]);


    const handleRep = useCallback((repType: 'successful_reps' | 'failed_reps') => {
        if (!currentPracticeSession || !currentDrillRun) {
            console.warn('Attempted to record a rep without an active practice session or drill run. currentPracticeSession:', currentPracticeSession, 'currentDrillRun:', currentDrillRun);
            return;
        }

        setCurrentDrillRun((previousDrillRun) => {
            if (!previousDrillRun) {
                return previousDrillRun;
            }

            const currentTotalReps = previousDrillRun.successful_reps + previousDrillRun.failed_reps;
            if (currentTotalReps >= REPS_PER_DRILL) {
                return previousDrillRun;
            }

            const updatedDrillRun = {
                ...previousDrillRun,
                [repType]: previousDrillRun[repType] + 1,
            };

            return updatedDrillRun;
        });
    }, [currentDrillRun, currentPracticeSession]);

    useEffect(() => {
        if (!currentDrillRun || !currentPracticeSession) {
            return;
        }

        const updatedTotalReps = currentDrillRun.successful_reps + currentDrillRun.failed_reps;
        if (updatedTotalReps !== REPS_PER_DRILL) {
            return;
        }

        if (lastCompletedRunIdRef.current === currentDrillRun.id) {
            return;
        }

        lastCompletedRunIdRef.current = currentDrillRun.id;
        void moveToNextDrill(currentDrillRun);
    }, [currentDrillRun, currentPracticeSession, moveToNextDrill]);

    const handleSuccess = useCallback(() => {
        void handleRep('successful_reps');
    }, [handleRep]);

    const handleFailure = useCallback(() => {
        void handleRep('failed_reps');
    }, [handleRep]);

    const remainingDrillsCount = Math.max(0, allDrills.length - currentDrillIndex - 1);
    const practiceReady = Boolean(currentPracticeSession && currentDrillRun);
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
        loading: screenLoading || state.loading || isInitializingPractice,
        error: screenError || flowError || state.error,
    };
}