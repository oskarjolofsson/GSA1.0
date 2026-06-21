import { useCallback, useEffect, useState } from "react";
import activityService, { type DayDetail } from "features/home/services/activityService";
import { getErrorMessage } from "lib/errors";

interface UseDayDetailReturn {
    detail: DayDetail | null;
    loading: boolean;
    error: string | null;
}

const DEVICE_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Fetch the sessions + analyses for a single day. Pass `null` to stay idle
 * (e.g. the day popup is closed). Refetches whenever `date` changes.
 */
export default function useDayDetail(date: string | null): UseDayDetailReturn {
    const [detail, setDetail] = useState<DayDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async (target: string) => {
        try {
            setLoading(true);
            setError(null);
            setDetail(null);
            const data = await activityService.getDayDetail(target, DEVICE_TZ);
            setDetail(data);
        } catch (err) {
            console.error("Error fetching day detail:", err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!date) {
            setDetail(null);
            setError(null);
            return;
        }
        fetchDetail(date);
    }, [date, fetchDetail]);

    return { detail, loading, error };
}
