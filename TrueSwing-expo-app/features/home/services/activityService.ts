import { apiClient } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { ActivityCount } from "features/home/utils/activityStats";

// Day-detail response shapes (GET /activity/{date}/). Mirror the backend
// ActivityDayDetail schema.
export type DayDrillRun = {
    id: string;
    drill_id: string;
    drill_title: string;
    successful_reps: number;
    failed_reps: number;
    skipped: boolean;
    started_at: string;
    completed_at: string | null;
};

export type DaySession = {
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    analysis_issue_id: string | null;
    drill_runs: DayDrillRun[];
};

export type DayAnalysis = {
    id: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    thumbnail_url: string | null;
};

export type DayDetail = {
    date: string;
    sessions: DaySession[];
    analyses: DayAnalysis[];
};

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
