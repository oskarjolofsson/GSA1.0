import { apiClient } from 'lib/apiClient';
import type { Analysis, AnalysisIssue, IssueSwingTimelineItem, VideoUrlResponse } from '../types';

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
     * The issue-progress timeline: the user's swings from this issue's first
     * detection onward (newest first), each annotated with the AI's confidence for
     * this issue (or detected=false when it wasn't flagged).
     */
    async getIssueSwingTimeline(issueId: string): Promise<IssueSwingTimelineItem[]> {
        const data = await apiClient.get<IssueSwingTimelineItem[]>(`/api/v1/analyses/by-issue/${issueId}/`);
        return Array.isArray(data) ? data : [];
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
