import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
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
        return apiClient.post<CreateIssueResponse>(routes.issues.root, request);
    }

    /**
     * Get issue by ID
     */
    async getIssueById(issueId: string): Promise<Issue> {
        return apiClient.get<Issue>(routes.issues.byId(issueId));
    }

    /**
     * Get all issues associated with an analysis
     */
    async getIssuesByAnalysis(analysisId: string): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.byAnalysis(analysisId));
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all issues
     */
    async getAllIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.root);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all issues for the current user
     */
    async getUserIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.root);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get the server-chosen "today's issue" for the current user. The selection
     * rule lives on the backend; returns null when the user has no issues.
     */
    async getTodaysIssue(): Promise<Issue | null> {
        const data = await apiClient.get<Issue | null>(routes.issues.todays);
        return data ?? null;
    }

    /**
     * Get all issues (admin endpoint)
     */
    async getAllIssuesAdmin(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.all);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Update an issue
     */
    async updateIssue(issueId: string, request: UpdateIssueRequest): Promise<Issue> {
        return apiClient.patch<Issue>(routes.issues.byId(issueId), request);
    }

    /**
     * Delete an issue
     */
    async deleteIssue(issueId: string): Promise<void> {
        await apiClient.delete<void>(routes.issues.byId(issueId));
    }

    /**
     * Bulk delete issues
     */
    async bulkDeleteIssues(issueIds: string[]): Promise<void> {
        await apiClient.delete<void>(routes.issues.bulk, { issue_ids: issueIds });
    }


    async markIssueAsDone(analysis_issue_id: string): Promise<Issue> {
        return apiClient.delete(routes.analyses.issueById(analysis_issue_id));
    }
}

export default new IssueService();
