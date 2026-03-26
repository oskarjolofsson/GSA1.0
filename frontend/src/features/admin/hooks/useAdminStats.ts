import { useState, useEffect, useCallback } from 'react';
import { getStats } from '../services/adminService';
import type { AdminStats } from '../types';

interface AdminStatsState {
    stats: AdminStats | null;
    loading: boolean;
    error: Error | null;
}

const defaultStats: AdminStats = {
    totalDrills: 0,
    totalIssues: 0,
    totalMappings: 0,
    totalUsers: 0,
    unmappedDrills: 0,
    issuesWithNoDrills: 0,
    newUsersLast7Days: 0,
    newUsersLast30Days: 0,
};

export const useAdminStats = () => {
    const [state, setState] = useState<AdminStatsState>({
        stats: null,
        loading: true,
        error: null,
    });

    const fetchStats = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await getStats();
            setState({
                stats: data,
                loading: false,
                error: null,
            });
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setState(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err : new Error('Failed to fetch stats'),
            }));
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats: state.stats ?? defaultStats,
        loading: state.loading,
        error: state.error,
        refetch: fetchStats,
    };
};
