import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { Analysis, AnalysisIssue, IssueSwingTimelineItem, VideoUrlResponse } from '../types';

class AnalysisService {
    /**
     * Fetch all analyses for current user
     */
    async getAnalysesForUser(): Promise<Analysis[]> {
        const data = await apiClient.get<Analysis[]>(routes.analyses.root);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Fetch single analysis by ID
     */
    async getAnalysisById(analysisId: string): Promise<Analysis> {
        return apiClient.get<Analysis>(routes.analyses.byId(analysisId));
    }

    /**
     * The issue-progress timeline: the user's swings from this issue's first
     * detection onward (newest first), each annotated with the AI's confidence for
     * this issue (or detected=false when it wasn't flagged).
     */
    async getIssueSwingTimeline(issueId: string): Promise<IssueSwingTimelineItem[]> {
        const data = await apiClient.get<IssueSwingTimelineItem[]>(routes.analyses.byIssue(issueId));
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get signed video URL for analysis
     */
    async getAnalysisVideoURL(analysisId: string, videoKey: string): Promise<string | null> {
        const data = await apiClient.get<VideoUrlResponse>(
            routes.analyses.videoUrl(analysisId, videoKey)
        );

        return data?.video_url || null;
    }

    /**
     * Delete analysis
     */
    async deleteAnalysis(analysisId: string): Promise<void> {
        console.log('Deleting analysis with ID:', analysisId);
        await apiClient.delete<void>(routes.analyses.byId(analysisId));
    }

    /**
     * Get all issues associated with an analysis
     */
    async getAnalysisIssues(analysisId: string): Promise<AnalysisIssue[]> {
        const data = await apiClient.get<AnalysisIssue[]>(
            routes.analyses.issues(analysisId)
        );
        return Array.isArray(data) ? data : [];
    }

    /**
     * Dismiss an issue the user disagrees with (soft-deactivates it for the user).
     */
    async dismissAnalysisIssue(analysisIssueId: string): Promise<void> {
        await apiClient.delete<void>(routes.analyses.issueById(analysisIssueId));
    }

    /**
     * Delete an analysis issue
     */
    async deleteAnalysisIssue(analysisId: string, analysisIssueId: string): Promise<void> {
        await apiClient.delete<void>(
            routes.analyses.issueOnAnalysis(analysisId, analysisIssueId)
        );
    }
}

export default new AnalysisService();
