import type { Prompt, CreateAnalysisResponse, AnalysisStatusResponse } from '../types';
import apiClient from 'lib/apiClient';

export async function create_analysis(prompt: Prompt, startTime: number = 0, endTime: number = 0): Promise<CreateAnalysisResponse> {
    // create body for the request
    const requestBody = {
        start_time: startTime,
        end_time: endTime,
        model: "gemini-3-pro-preview",
        prompt_shape: prompt.desired_shot,
        prompt_miss: prompt.miss,
        prompt_extra: prompt.extra
    };

    const result = await apiClient.post<CreateAnalysisResponse>('/api/v1/analyses/', requestBody) as CreateAnalysisResponse;

    if (!result || !result.upload_url || !result.analysis_id) {
        throw new Error('Failed to create analysis and get upload URL');
    }

    return result;
}


export async function upload_video(uploadUrl: string, videoUri: string): Promise<void> {
    // Validate the videoUri and uploadUrl
    if (!uploadUrl || !videoUri) {
        throw new Error('Invalid upload URL or video URI');
    }

    try {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            // Passing the local URI directly as the body object streams it
            body: { uri: videoUri } as any, 
            headers: {
                'Content-Type': 'video/mp4', 
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to upload video: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}


export async function confirm_upload(analysisId: string): Promise<void> {
    if (!analysisId) {
        throw new Error('Invalid analysis ID for confirmation');
    }
    const result = await apiClient.patch(`/api/v1/analyses/${analysisId}/`);
}


export async function get_analysis_status(analysisId: string): Promise<AnalysisStatusResponse> {
    if (!analysisId) {
        throw new Error('Invalid analysis ID for status check');
    }
    return await apiClient.get<AnalysisStatusResponse>(`/api/v1/analyses/${analysisId}/`) as AnalysisStatusResponse;
}