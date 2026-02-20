import { supabase } from '@/lib/supabase';
import type { Analysis, AnalysisIssue, VideoUrlResponse } from '../types';

const API = import.meta.env.VITE_API_URL || '';

interface VideoURLCache {
    [key: string]: string;
}

class AnalysisService {
    private videoURLCache: VideoURLCache = {};

    /**
     * Helper method for authenticated fetch requests
     */
    private async fetchWithAuth<T>(
        url: string,
        method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
        body: any = null
    ): Promise<T> {
        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session) throw new Error('Not signed in');

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API}${url}`, options);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server error ${response.status}: ${text || response.statusText}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Fetch all analyses for current user
     */
    async getAnalysesForUser(): Promise<Analysis[]> {
        try {
            const data = await this.fetchWithAuth<Analysis[]>('/api/v1/analyses');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getAnalysesForUser:', error);
            throw new Error('Could not fetch analyses. Please try again later.');
        }
    }

    /**
     * Fetch single analysis by ID
     */
    async getAnalysisById(analysisId: string): Promise<Analysis> {
        try {
            const data = await this.fetchWithAuth<Analysis>(`/api/v1/analyses/${analysisId}`);
            return data;
        } catch (error) {
            console.error('Error in getAnalysisById:', error);
            throw new Error('Could not fetch analysis. Please try again later.');
        }
    }

    /**
     * Get signed video URL for analysis with caching
     */
    async getAnalysisVideoURL(analysisId: string, videoKey: string): Promise<string | null> {
        try {
            // Check cache first
            if (this.videoURLCache[analysisId]) {
                console.log('Using cached video URL for analysis:', analysisId);
                return this.videoURLCache[analysisId];
            }

            const data = await this.fetchWithAuth<VideoUrlResponse>(
                `/api/v1/analyses/${analysisId}/video-url?video_key=${encodeURIComponent(videoKey)}`
            );
            
            const url = data?.video_url || null;

            // Cache the result
            if (url) {
                this.videoURLCache[analysisId] = url;
            }

            return url;
        } catch (error) {
            console.error('Error in getAnalysisVideoURL:', error);
            throw new Error('Could not fetch video URL. Please try again later.');
        }
    }

    /**
     * Delete analysis
     */
    async deleteAnalysis(analysisId: string): Promise<void> {
        console.log('Deleting analysis with ID:', analysisId);
        try {
            await this.fetchWithAuth<void>(`/api/v1/analyses/${analysisId}`, 'DELETE');
        } catch (error) {
            console.error('Error in deleteAnalysis:', error);
            throw new Error('Could not delete analysis. Please try again later.');
        }
    }

    /**
     * Get all issues associated with an analysis
     */
    async getAnalysisIssues(analysisId: string): Promise<AnalysisIssue[]> {
        try {
            const data = await this.fetchWithAuth<AnalysisIssue[]>(
                `/api/v1/analyses/${analysisId}/issues`
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getAnalysisIssues:', error);
            throw new Error('Could not fetch analysis issues. Please try again later.');
        }
    }

    /**
     * Delete an analysis issue
     */
    async deleteAnalysisIssue(analysisId: string, analysisIssueId: string): Promise<void> {
        try {
            await this.fetchWithAuth<void>(
                `/api/v1/analyses/${analysisId}/issues/${analysisIssueId}`,
                'DELETE'
            );
        } catch (error) {
            console.error('Error in deleteAnalysisIssue:', error);
            throw new Error('Could not delete analysis issue. Please try again later.');
        }
    }
}

export default new AnalysisService();
