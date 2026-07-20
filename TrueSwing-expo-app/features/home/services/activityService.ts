import { apiClient } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { Schemas } from "lib/api/types";
import type { ActivityCount } from "features/home/utils/activityStats";

// Day-detail response shapes (GET /activity/{date}/), derived from the backend
// OpenAPI schema (lib/api/schema.d.ts). Regenerate via `npm run gen:api-types`.
export type DayDrillRun = Schemas["ActivityDrillRun"];
export type DaySession = Schemas["ActivitySession"];
export type DayAnalysis = Schemas["ActivityAnalysis"];
export type DayDetail = Schemas["ActivityDayDetail"];

class ActivityService {
    /**
     * Per-day activity counts for the contribution graph. `tz` is an IANA
     * timezone name so the backend groups days in the user's local time.
     */
    async getActivity(tz: string): Promise<ActivityCount[]> {
        const data = await apiClient.get<ActivityCount[]>(routes.activity.list(tz));
        return Array.isArray(data) ? data : [];
    }

    /**
     * The specific sessions + analyses on a given day (YYYY-MM-DD), grouped in
     * the same `tz` as the counts so the day window matches the lit square.
     */
    async getDayDetail(date: string, tz: string): Promise<DayDetail> {
        return apiClient.get<DayDetail>(routes.activity.byDate(date, tz));
    }
}

export default new ActivityService();
