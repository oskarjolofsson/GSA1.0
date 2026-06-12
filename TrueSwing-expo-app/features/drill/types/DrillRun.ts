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
