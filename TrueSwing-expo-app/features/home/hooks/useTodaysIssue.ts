import { useCallback, useEffect, useState } from "react";
import issueService from "features/issues/services/issueService";
import type { Issue } from "features/issues/types";
import { getErrorMessage } from "lib/errors";

interface UseTodaysIssueReturn {
    issues: Issue[]; // the user's issues, for the switcher
    defaultIssueId: string | null; // server-chosen "today's issue"
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Powers the home prescription card: the full list of the user's issues (for
 * the switcher) plus the server-chosen default. Both fetched in parallel.
 */
export default function useTodaysIssue(): UseTodaysIssueReturn {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [defaultIssueId, setDefaultIssueId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [list, todays] = await Promise.all([
                issueService.getUserIssues(),
                issueService.getTodaysIssue(),
            ]);
            setIssues(list);
            // Prefer the server default; fall back to the first issue.
            setDefaultIssueId(todays?.id ?? list[0]?.id ?? null);
        } catch (err) {
            console.error("Error fetching today's issue:", err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { issues, defaultIssueId, loading, error, refetch };
}
