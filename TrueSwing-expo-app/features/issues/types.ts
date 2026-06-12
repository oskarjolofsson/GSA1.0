
export interface Issue {
    id: string;
    title: string;
    phase: string | null;
    description: string | null;
    current_motion: string | null;
    expected_motion: string | null;
    swing_effect: string | null;
    shot_outcome: string | null;
    created_at: string;
    confidence?: number;
    analysis_issue_id: string; 
    analysis_id?: string; 
    progress?: AnalysisIssueProgress;
}

export interface CreateIssueRequest {
    title: string;
    phase?: string;
    current_motion?: string;
    expected_motion?: string;
    swing_effect?: string;
    shot_outcome?: string;
}

export interface CreateIssueResponse {
    success: boolean;
    issue_id: string;
}

export interface UpdateIssueRequest {
    title?: string;
    phase?: string;
    current_motion?: string;
    expected_motion?: string;
    swing_effect?: string;
    shot_outcome?: string;
}


interface AnalysisIssueProgress {
    completed_sessions: number;
    total_successful_reps: number;
    overall_success_rate: number | null;
    recent_session_success_rates: number | null;
    delta: number | null;
    last_completed_at: string | null;
}
