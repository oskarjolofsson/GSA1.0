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
