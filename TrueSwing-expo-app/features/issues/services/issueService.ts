import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type {
    Issue,
    CreateIssueRequest,
    CreateIssueResponse,
    UpdateIssueRequest
} from '../types';

export class IssueService {
    async createIssue(request: CreateIssueRequest): Promise<CreateIssueResponse> {
        return apiClient.post<CreateIssueResponse>(routes.issues.root, request);
    }

    async getIssueById(issueId: string): Promise<Issue> {
        return apiClient.get<Issue>(routes.issues.byId(issueId));
    }

    async getIssuesByAnalysis(analysisId: string): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.byAnalysis(analysisId));
        return Array.isArray(data) ? data : [];
    }

    async getAllIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.root);
        return Array.isArray(data) ? data : [];
    }

    async getUserIssues(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.root);
        return Array.isArray(data) ? data : [];
    }

    /** The server-chosen "today's issue". Null when the user has no issues. */
    async getTodaysIssue(): Promise<Issue | null> {
        const data = await apiClient.get<Issue | null>(routes.issues.todays);
        return data ?? null;
    }

    async getAllIssuesAdmin(): Promise<Issue[]> {
        const data = await apiClient.get<Issue[]>(routes.issues.all);
        return Array.isArray(data) ? data : [];
    }

    async updateIssue(issueId: string, request: UpdateIssueRequest): Promise<Issue> {
        return apiClient.patch<Issue>(routes.issues.byId(issueId), request);
    }

    async deleteIssue(issueId: string): Promise<void> {
        await apiClient.delete<void>(routes.issues.byId(issueId));
    }

    async bulkDeleteIssues(issueIds: string[]): Promise<void> {
        await apiClient.delete<void>(routes.issues.bulk, { issue_ids: issueIds });
    }


    async markIssueAsDone(analysis_issue_id: string): Promise<Issue> {
        return apiClient.delete(routes.analyses.issueById(analysis_issue_id));
    }
}

export default new IssueService();
