import { supabase } from '@/lib/supabase';
import type {
    Issue,
    CreateIssueRequest,
    CreateIssueResponse,
    UpdateIssueRequest
} from '../types';

const API = import.meta.env.VITE_API_URL || '';

class IssueService {
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
     * Create a new issue
     */
    async createIssue(request: CreateIssueRequest): Promise<CreateIssueResponse> {
        try {
            return await this.fetchWithAuth<CreateIssueResponse>('/api/v1/issues/', 'POST', request);
        } catch (error) {
            console.error('Error in createIssue:', error);
            throw new Error('Could not create issue. Please try again later.');
        }
    }

    /**
     * Get issue by ID
     */
    async getIssueById(issueId: string): Promise<Issue> {
        try {
            return await this.fetchWithAuth<Issue>(`/api/v1/issues/${issueId}`);
        } catch (error) {
            console.error('Error in getIssueById:', error);
            throw new Error('Could not fetch issue. Please try again later.');
        }
    }

    /**
     * Get all issues associated with an analysis
     */
    async getIssuesByAnalysis(analysisId: string): Promise<Issue[]> {
        try {
            const data = await this.fetchWithAuth<Issue[]>(
                `/api/v1/issues/by-analysis/${analysisId}`
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getIssuesByAnalysis:', error);
            throw new Error('Could not fetch issues for analysis. Please try again later.');
        }
    }

    /**
     * Get all issues associated with a drill
     */
    async getIssuesByDrill(drillId: string): Promise<Issue[]> {
        try {
            const data = await this.fetchWithAuth<Issue[]>(
                `/api/v1/issues/by-drill/${drillId}`
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getIssuesByDrill:', error);
            throw new Error('Could not fetch issues for drill. Please try again later.');
        }
    }

    /**
     * Get all issues
     */
    async getAllIssues(): Promise<Issue[]> {
        try {
            const data = await this.fetchWithAuth<Issue[]>('/api/v1/issues/');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getAllIssues:', error);
            throw new Error('Could not fetch issues. Please try again later.');
        }
    }

    /**
     * Update an issue
     */
    async updateIssue(issueId: string, request: UpdateIssueRequest): Promise<Issue> {
        try {
            return await this.fetchWithAuth<Issue>(
                `/api/v1/issues/${issueId}`,
                'PATCH',
                request
            );
        } catch (error) {
            console.error('Error in updateIssue:', error);
            throw new Error('Could not update issue. Please try again later.');
        }
    }

    /**
     * Delete an issue
     */
    async deleteIssue(issueId: string): Promise<void> {
        try {
            await this.fetchWithAuth<void>(`/api/v1/issues/${issueId}`, 'DELETE');
        } catch (error) {
            console.error('Error in deleteIssue:', error);
            throw new Error('Could not delete issue. Please try again later.');
        }
    }
}

export default new IssueService();
