
import type { Issue } from 'features/issues/types';

export interface Analysis {
    analysis_id: string;
    user_id: string;
    video_id: string;
    model_version: string | null;
    status: string;
    success: boolean | null;
    error_message: string | null;
    thumbnail_url: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
}

export interface AnalysisIssue {
    analysis_issue_id: string;
    analysis_id: string;
    issue_id: string;
    confidence: number;
    created_at: string;
}

export interface CreateAnalysisRequest {
    model?: string;
    start_time: number;
    end_time: number;
    prompt_shape?: string;
    prompt_height?: string;
    prompt_misses?: string;
    prompt_extra?: string;
}

export interface CreateAnalysisResponse {
    success: boolean;
    analysis_id: string;
    upload_url: string;
}

export interface VideoUrlResponse {
    success: boolean;
    video_url: string;
}

// Combined analysis with issues for component use
export interface AnalysisWithIssues extends Analysis {
    issues?: (Issue & { confidence?: number })[];
    video_key?: string;
}