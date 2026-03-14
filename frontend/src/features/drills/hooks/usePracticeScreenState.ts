import { useState, useEffect } from 'react';
import { DrillService } from '@/features/drills/services/drillService';
import { IssueService }  from '@/features/issues/services/issueService';
import { useActiveDrill } from './usePracticeFlow';
import type { Drill } from '../types';
import type { Issue } from '@/features/issues/types';

interface UsePracticeDrillsReturn {
    activeDrill: Drill | null;
    remainingDrillsCount: number;
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

export function usePracticeDrills(issueId: string): UsePracticeDrillsReturn {
    const [allDrills, setDrills] = useState<Drill[]>([]);
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const drillService = new DrillService();
    const issueService = new IssueService();

    useEffect(() => {
        const fetchIssueAndDrills = async () => {
            if (!issueId) {
                setDrills([]);
                setIssue(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const fetchedDrills = await drillService.getDrillsByIssue(issueId);
                const fetchedIssue: Issue = await issueService.getIssueById(issueId);
                setDrills(fetchedDrills);
                setIssue(fetchedIssue);
            } catch (err) {
                console.error('Error fetching drills or issue:', err);
                setError(err instanceof Error ? err.message : 'Internal error occurred while loading drills');
                setDrills([]);
                setIssue(null);
            } finally {
                setLoading(false);
            }
        };

        fetchIssueAndDrills();

    }, [issueId]);

    const {
        activeDrill,
        progress,
        remainingDrillsCount,
        handleSuccess,
        handleFailure,
        loading: activeDrillLoading,
        error: activeDrillError,
    } =
        useActiveDrill(allDrills, issue);

    return {
        activeDrill,
        remainingDrillsCount,
        progress,
        handleSuccess,
        handleFailure,
        loading: loading || activeDrillLoading,
        error: error || activeDrillError,
    };
}