import { apiClient } from 'lib/apiClient';
import type { Analysis, AnalysisIssue, VideoUrlResponse } from '../types';

class AnalysisService {
    /**
     * Fetch all analyses for current user
     */
    async getAnalysesForUser(): Promise<Analysis[]> {
        const data = await apiClient.get<Analysis[]>('/api/v1/analyses/');
        return Array.isArray(data) ? data : [];
    }

    /**
     * Fetch single analysis by ID
     */
    async getAnalysisById(analysisId: string): Promise<Analysis> {
        return apiClient.get<Analysis>(`/api/v1/analyses/${analysisId}/`);
    }

    /**
     * Get signed video URL for analysis
     */
    async getAnalysisVideoURL(analysisId: string, videoKey: string): Promise<string | null> {
        const data = await apiClient.get<VideoUrlResponse>(
            `/api/v1/analyses/${analysisId}/video-url/?video_key=${encodeURIComponent(videoKey)}`
        );

        return data?.video_url || null;
    }

    /**
     * Delete analysis
     */
    async deleteAnalysis(analysisId: string): Promise<void> {
        console.log('Deleting analysis with ID:', analysisId);
        await apiClient.delete<void>(`/api/v1/analyses/${analysisId}/`);
    }

    /**
     * Get all issues associated with an analysis
     */
    async getAnalysisIssues(analysisId: string): Promise<AnalysisIssue[]> {
        const data = await apiClient.get<AnalysisIssue[]>(
            `/api/v1/analyses/${analysisId}/issues/`
        );
        return Array.isArray(data) ? data : [];
    }

    /**
     * Delete an analysis issue
     */
    async deleteAnalysisIssue(analysisId: string, analysisIssueId: string): Promise<void> {
        await apiClient.delete<void>(
            `/api/v1/analyses/${analysisId}/issues/${analysisIssueId}/`
        );
    }
}

export default new AnalysisService();
