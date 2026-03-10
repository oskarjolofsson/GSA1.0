import { useState, useEffect } from 'react';
import { DrillService } from '@/features/drills/services/drillService';
import type { Drill } from '../types';

interface UsePracticeDrillsReturn {
    drills: Drill[];
    loading: boolean;
    error: string | null;
}

export function usePracticeDrills(issueId: string): UsePracticeDrillsReturn {
    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const drillService = new DrillService();

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

    return { drills, loading, error };
}