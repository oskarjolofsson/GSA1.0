import type { Analysis } from "features/analysis/types";



export interface Prompt {
    desired_shot: string;
    miss: string;
    extra: string;
    start_time: number
    end_time: number;
}


export interface CreateAnalysisResponse {
    upload_url: string;
    analysis_id: string;
}


export interface AnalysisStatusResponse {
    status: string;
    error_message: string | null;
    analysis: Analysis | null;
}