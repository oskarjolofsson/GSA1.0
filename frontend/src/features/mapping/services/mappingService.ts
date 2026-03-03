import { apiClient } from '@/lib/apiClient';
import type {
    IssueDrill,
    CreateIssueDrillRequest,
    CreateIssueDrillResponse,
    DeleteIssueDrillResponse
} from '../types';

export class MappingService {
    /**
     * Create a new issue-drill link
     */
    async createIssueDrill(request: CreateIssueDrillRequest): Promise<CreateIssueDrillResponse> {
        return apiClient.post<CreateIssueDrillResponse>('/api/v1/issue-drills/', request);
    }

    /**
     * Get issue-drill link by ID
     */
    async getIssueDrillById(issueDrillId: string): Promise<IssueDrill> {
        return apiClient.get<IssueDrill>(`/api/v1/issue-drills/${issueDrillId}`);
    }

    /**
     * Get all issue-drill links for a specific issue
     */
    async getIssueDrillsByIssueId(issueId: string): Promise<IssueDrill[]> {
        return apiClient.get<IssueDrill[]>(`/api/v1/issue-drills/issue/${issueId}`);
    }

    /**
     * Get all issue-drill links for a specific drill
     */
    async getIssueDrillsByDrillId(drillId: string): Promise<IssueDrill[]> {
        return apiClient.get<IssueDrill[]>(`/api/v1/issue-drills/drill/${drillId}`);
    }

    /**
     * Delete an issue-drill link
     */
    async deleteIssueDrill(issueDrillId: string): Promise<DeleteIssueDrillResponse> {
        return apiClient.delete<DeleteIssueDrillResponse>(`/api/v1/issue-drills/${issueDrillId}`);
    }

    /**
     * Get linked drill IDs for an issue (convenience method)
     */
    async getLinkedDrillIds(issueId: string): Promise<string[]> {
        const links = await this.getIssueDrillsByIssueId(issueId);
        return links.map(link => link.drill_id);
    }

    /**
     * Get linked issue IDs for a drill (convenience method)
     */
    async getLinkedIssueIds(drillId: string): Promise<string[]> {
        const links = await this.getIssueDrillsByDrillId(drillId);
        return links.map(link => link.issue_id);
    }

    /**
     * Link a drill to an issue (convenience method)
     */
    async linkDrillToIssue(issueId: string, drillId: string): Promise<CreateIssueDrillResponse> {
        console.log(`Linking drill ${drillId} to issue ${issueId}`);
        return this.createIssueDrill({ issue_id: issueId, drill_id: drillId });
    }

    /**
     * Unlink a drill from an issue by finding and deleting the link
     */
    async unlinkDrillFromIssue(issueId: string, drillId: string): Promise<void> {
        const links = await this.getIssueDrillsByIssueId(issueId);
        const link = links.find(l => l.drill_id === drillId);
        if (link) {
            await this.deleteIssueDrill(link.id);
        }
    }
}

const mappingService = new MappingService();
export default mappingService;
