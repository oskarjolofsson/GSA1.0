import { apiClient } from '@/lib/apiClient';
import type { Analysis, AnalysisIssue, VideoUrlResponse } from '../types';

interface VideoURLCache {
    [key: string]: string;
}

class AnalysisService {
    private videoURLCache: VideoURLCache = {};

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
     * Get signed video URL for analysis with caching
     */
    async getAnalysisVideoURL(analysisId: string, videoKey: string): Promise<string | null> {
        // Check cache first
        if (this.videoURLCache[analysisId]) {
            console.log('Using cached video URL for analysis:', analysisId);
            return this.videoURLCache[analysisId];
        }

        const data = await apiClient.get<VideoUrlResponse>(
            `/api/v1/analyses/${analysisId}/video-url/?video_key=${encodeURIComponent(videoKey)}`
        );
        
        const url = data?.video_url || null;

        // Cache the result
        if (url) {
            this.videoURLCache[analysisId] = url;
        }

        return url;
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
