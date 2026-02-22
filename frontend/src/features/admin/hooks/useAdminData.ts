import { useState, useEffect } from 'react';
import issueService from '@/features/issues/services/issueService';
import drillService from '@/features/drills/services/drillService';
import type { Issue } from '@/features/issues/types';
import type { Drill } from '@/features/drills/types';

interface AdminDataState {
    issues: Issue[];
    drills: Drill[];
    loading: boolean;
    error: string | null;
}

export const useAdminData = () => {
    const [state, setState] = useState<AdminDataState>({
        issues: [],
        drills: [],
        loading: true,
        error: null,
    });

    const fetchAllData = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const [issuesData, drillsData] = await Promise.all([
                issueService.getAllIssuesAdmin(),
                drillService.getAllDrills(),
            ]);

            setState({
                issues: issuesData,
                drills: drillsData,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch data',
            }));
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    return {
        ...state,
        refetch: fetchAllData,
    };
};
