import { apiClient } from "lib/apiClient";
import type { ActivityCount } from "features/home/utils/activityStats";

class ActivityService {
    /**
     * Per-day activity counts for the contribution graph. `tz` is an IANA
     * timezone name so the backend groups days in the user's local time.
     */
    async getActivity(tz: string): Promise<ActivityCount[]> {
        const data = await apiClient.get<ActivityCount[]>(
            `/api/v1/activity/?tz=${encodeURIComponent(tz)}`
        );
        return Array.isArray(data) ? data : [];
    }
}

export default new ActivityService();
