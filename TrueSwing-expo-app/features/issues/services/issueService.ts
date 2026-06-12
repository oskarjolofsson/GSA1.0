import { apiClient } from 'lib/apiClient';
import type {
    Issue,
    CreateIssueRequest,
    CreateIssueResponse,
    UpdateIssueRequest
} from '../types';

export class IssueService {
    /**
     * Create a new issue
     */
    async createIssue(request: CreateIssueRequest): Promise<CreateIssueResponse> {
        return apiClient.post<CreateIssueResponse>('/api/v1/issues/', request);
    }

    /**
     * Get issue by ID
     */
    async getIssueById(issueId: string): Promise<Issue> {
        return apiClient.get<Issue>(`/api/v1/issues/${issueId}/`);
    }

    /**
     * Get all issues associated with an analysis
     */
    async getIssuesByAnalysis(analysisId: string): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(`/api/v1/issues/by-analysis/${analysisId}/`);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all issues
     */
    async getAllIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>('/api/v1/issues/');
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all issues for the current user
     */
    async getUserIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>('/api/v1/issues/');
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all issues (admin endpoint)
     */
    async getAllIssuesAdmin(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>('/api/v1/issues/all/');
        return Array.isArray(data) ? data : [];
    }

    /**
     * Update an issue
     */
    async updateIssue(issueId: string, request: UpdateIssueRequest): Promise<Issue> {
        return apiClient.patch<Issue>(`/api/v1/issues/${issueId}/`, request);
    }

    /**
     * Delete an issue
     */
    async deleteIssue(issueId: string): Promise<void> {
        await apiClient.delete<void>(`/api/v1/issues/${issueId}/`);
    }

    /**
     * Bulk delete issues
     */
    async bulkDeleteIssues(issueIds: string[]): Promise<void> {
        await apiClient.delete<void>('/api/v1/issues/bulk/', { issue_ids: issueIds });
    }


    async markIssueAsDone(analysis_issue_id: string): Promise<Issue> {
        return apiClient.delete(`/api/v1/analyses/issues/${analysis_issue_id}/`);
    }
}

export default new IssueService();
