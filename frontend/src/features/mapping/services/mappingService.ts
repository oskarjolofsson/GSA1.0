import { supabase } from '@/lib/supabase';
import type {
    IssueDrill,
    CreateIssueDrillRequest,
    CreateIssueDrillResponse,
    DeleteIssueDrillResponse
} from '../types';

const API = import.meta.env.VITE_API_URL || '';

export class MappingService {
    /**
     * Helper method for authenticated fetch requests
     */
    private async fetchWithAuth<T>(
        url: string,
        method: 'GET' | 'POST' | 'DELETE' = 'GET',
        body: unknown = null
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
            try {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Server error ${response.status}`);
            } catch {
                throw new Error(`Server error ${response.status}: ${response.statusText}`);
            }
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Create a new issue-drill link
     */
    async createIssueDrill(request: CreateIssueDrillRequest): Promise<CreateIssueDrillResponse> {
        try {
            return await this.fetchWithAuth<CreateIssueDrillResponse>(
                '/api/v1/issue-drills/',
                'POST',
                request
            );
        } catch (error) {
            console.error('Error in createIssueDrill:', error);
            throw new Error('Could not create issue-drill link. Please try again later.');
        }
    }

    /**
     * Get issue-drill link by ID
     */
    async getIssueDrillById(issueDrillId: string): Promise<IssueDrill> {
        try {
            return await this.fetchWithAuth<IssueDrill>(`/api/v1/issue-drills/${issueDrillId}`);
        } catch (error) {
            console.error('Error in getIssueDrillById:', error);
            throw new Error('Could not fetch issue-drill link. Please try again later.');
        }
    }

    /**
     * Get all issue-drill links for a specific issue
     */
    async getIssueDrillsByIssueId(issueId: string): Promise<IssueDrill[]> {
        try {
            return await this.fetchWithAuth<IssueDrill[]>(`/api/v1/issue-drills/issue/${issueId}`);
        } catch (error) {
            console.error('Error in getIssueDrillsByIssueId:', error);
            throw new Error('Could not fetch issue-drill links. Please try again later.');
        }
    }

    /**
     * Get all issue-drill links for a specific drill
     */
    async getIssueDrillsByDrillId(drillId: string): Promise<IssueDrill[]> {
        try {
            return await this.fetchWithAuth<IssueDrill[]>(`/api/v1/issue-drills/drill/${drillId}`);
        } catch (error) {
            console.error('Error in getIssueDrillsByDrillId:', error);
            throw new Error('Could not fetch issue-drill links. Please try again later.');
        }
    }

    /**
     * Delete an issue-drill link
     */
    async deleteIssueDrill(issueDrillId: string): Promise<DeleteIssueDrillResponse> {
        try {
            return await this.fetchWithAuth<DeleteIssueDrillResponse>(
                `/api/v1/issue-drills/${issueDrillId}`,
                'DELETE'
            );
        } catch (error) {
            console.error('Error in deleteIssueDrill:', error);
            throw new Error('Could not delete issue-drill link. Please try again later.');
        }
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
