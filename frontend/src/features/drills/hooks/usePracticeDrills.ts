import { useState, useEffect } from 'react';
import { DrillService } from '@/features/drills/services/drillService';
import { useActiveDrill } from './useActiveDrill';
import type { Drill } from '../types';

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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const drillService = new DrillService();

    const { activeDrill, progress, remainingDrillsCount, handleSuccess, handleFailure } =
        useActiveDrill(allDrills, issueId);

    useEffect(() => {
        const fetchDrills = async () => {
            if (!issueId) {
                setDrills([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const fetchedDrills = await drillService.getDrillsByIssue(issueId);
                setDrills(fetchedDrills);
            } catch (err) {
                console.error('Error fetching drills:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch drills');
                setDrills([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDrills();
    }, [issueId]);

    return {
        activeDrill,
        remainingDrillsCount,
        progress,
        handleSuccess,
        handleFailure,
        loading,
        error,
    };
}