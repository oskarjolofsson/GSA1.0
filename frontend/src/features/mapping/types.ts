export interface IssueDrill {
    id: string;
    issue_id: string;
    drill_id: string;
    created_at: string;
}

export interface CreateIssueDrillRequest {
    issue_id: string;
    drill_id: string;
}

export interface CreateIssueDrillResponse {
    success: boolean;
    issue_drill_id: string;
}

export interface DeleteIssueDrillResponse {
    success: boolean;
}
