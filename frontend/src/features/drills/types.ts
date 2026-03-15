export interface Drill {
    id: string;
    title: string;
    task: string;
    success_signal: string;
    fault_indicator: string;
    created_at: string;
}

export interface CreateDrillRequest {
    title: string;
    task: string;
    success_signal: string;
    fault_indicator: string;
}

export interface CreateDrillResponse {
    success: boolean;
    drill_id: string;
}

export interface UpdateDrillRequest {
    title?: string;
    task?: string;
    success_signal?: string;
    fault_indicator?: string;
}

export interface PracticeSession {
    id: string;
    user_id: string;
    analysis_issue_id?: string;
    status: string;
    started_at: Date;
    completed_at?: Date;
}


export interface DrillRun {
    id: string;
    drill_title: string;
    session_id: string;
    drill_id: string;
    status: string;
    successful_reps: number;
    failed_reps: number;
    skipped: boolean;
    started_at: Date;
    completed_at?: Date;
}