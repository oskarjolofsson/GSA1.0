export interface Issue {
    id: string;
    title: string;
    phase: string | null;
    current_motion: string | null;
    expected_motion: string | null;
    swing_effect: string | null;
    shot_outcome: string | null;
    created_at: string;
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
