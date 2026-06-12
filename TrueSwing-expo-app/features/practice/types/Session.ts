export interface PracticeSession {
    id: string;
    user_id: string;
    analysis_issue_id?: string;
    status: string;
    started_at: Date;
    completed_at?: Date;
}
