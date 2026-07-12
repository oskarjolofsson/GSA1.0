
export interface Issue {
    id: string;
    title: string;
    description: string | null;
    area: string;
    kind: "fault" | "skill";
    layman_title: string | null;
    layman_desc: string | null;
    current_motion: string | null;
    expected_motion: string | null;
    swing_effect: string | null;
    shot_outcome: string | null;
    created_at: string;
    confidence?: number;
    // Null for user-authored (coach/browse) issues, which have no source analysis.
    analysis_issue_id: string | null;
    analysis_id?: string;
    progress?: AnalysisIssueProgress;
    program_status?: "active" | "completed" | null;
    source?: "catalog" | "custom";
}

export interface CreateIssueRequest {
    title: string;
    area?: string;
    kind?: "fault" | "skill";
    current_motion?: string;
    expected_motion?: string;
    swing_effect?: string;
    shot_outcome?: string;
    layman_title?: string;
    layman_desc?: string;
    miss?: string;
    goals?: string[];
}

export interface CreateIssueResponse {
    success: boolean;
    issue_id: string;
}

export interface UpdateIssueRequest {
    title?: string;
    area?: string;
    kind?: "fault" | "skill";
    current_motion?: string;
    expected_motion?: string;
    swing_effect?: string;
    shot_outcome?: string;
    layman_title?: string;
    layman_desc?: string;
}


interface AnalysisIssueProgress {
    completed_sessions: number;
    total_successful_reps: number;
    overall_success_rate: number | null;
    recent_session_success_rates: number | null;
    delta: number | null;
    last_completed_at: string | null;
}
