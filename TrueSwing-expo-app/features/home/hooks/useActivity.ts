import { useCallback, useEffect, useState } from "react";
import activityService from "features/home/services/activityService";
import type { ActivityCount } from "features/home/utils/activityStats";
import { getErrorMessage } from "lib/errors";

interface UseActivityReturn {
    counts: ActivityCount[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export type { UseActivityReturn };

const DEVICE_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Fetch the user's per-day activity counts for the home contribution graph.
 * Mirrors useAnalyses: keeps the last good data on a refetch failure so a
 * dropped connection doesn't wipe the grid.
 */
export default function useActivity(): UseActivityReturn {
    const [counts, setCounts] = useState<ActivityCount[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetched = await activityService.getActivity(DEVICE_TZ);
            setCounts(fetched);
        } catch (err) {
            console.error("Error fetching activity:", err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { counts, loading, error, refetch };
}
