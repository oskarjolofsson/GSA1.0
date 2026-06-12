import { useState, useEffect } from 'react';
import issueService from '../services/issueService';
import type { Issue } from '../types';

interface UseIssueReturn {
    issues: Issue[];
    loading: boolean;
    error: string | null;
    refreshIssues: () => Promise<void>;
    activeIssue: Issue | null;
    selectIssue: (issueId: string) => void;
}

export type { UseIssueReturn };

/**
 * Custom hook to fetch and manage issues for the current user
 */
export function useIssue(): UseIssueReturn {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await issueService.getUserIssues();
            setIssues(data);
            setActiveIssue(data.length > 0 ? data[0] : null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch issues';
            setError(errorMessage);
            console.error('Error fetching user issues:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const selectIssue = (issueId: string) => {
        const issue = issues.find((i) => i.id === issueId);
        if (issue) {
            setActiveIssue(issue);
        }
    };

    return {
        issues,
        loading,
        error,
        refreshIssues: fetchIssues,
        activeIssue,
        selectIssue,
    };
}


