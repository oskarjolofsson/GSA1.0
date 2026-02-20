import { supabase } from '@/lib/supabase';
import type {
    Drill,
    CreateDrillRequest,
    CreateDrillResponse,
    UpdateDrillRequest
} from '../types';

const API = import.meta.env.VITE_API_URL || '';

class DrillService {
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
     * Create a new drill
     */
    async createDrill(request: CreateDrillRequest): Promise<CreateDrillResponse> {
        try {
            return await this.fetchWithAuth<CreateDrillResponse>('/api/v1/drills/', 'POST', request);
        } catch (error) {
            console.error('Error in createDrill:', error);
            throw new Error('Could not create drill. Please try again later.');
        }
    }

    /**
     * Get drill by ID
     */
    async getDrillById(drillId: string): Promise<Drill> {
        try {
            return await this.fetchWithAuth<Drill>(`/api/v1/drills/${drillId}`);
        } catch (error) {
            console.error('Error in getDrillById:', error);
            throw new Error('Could not fetch drill. Please try again later.');
        }
    }

    /**
     * Get all drills associated with an analysis
     */
    async getDrillsByAnalysis(analysisId: string): Promise<Drill[]> {
        try {
            const data = await this.fetchWithAuth<Drill[]>(
                `/api/v1/drills/by-analysis/${analysisId}`
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getDrillsByAnalysis:', error);
            throw new Error('Could not fetch drills for analysis. Please try again later.');
        }
    }

    /**
     * Get all drills associated with an issue
     */
    async getDrillsByIssue(issueId: string): Promise<Drill[]> {
        try {
            const data = await this.fetchWithAuth<Drill[]>(
                `/api/v1/drills/by-issue/${issueId}`
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getDrillsByIssue:', error);
            throw new Error('Could not fetch drills for issue. Please try again later.');
        }
    }

    /**
     * Get all drills for current user
     */
    async getDrillsForUser(): Promise<Drill[]> {
        try {
            const data = await this.fetchWithAuth<Drill[]>('/api/v1/drills/');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error in getDrillsForUser:', error);
            throw new Error('Could not fetch drills. Please try again later.');
        }
    }

    /**
     * Update a drill
     */
    async updateDrill(drillId: string, request: UpdateDrillRequest): Promise<Drill> {
        try {
            return await this.fetchWithAuth<Drill>(
                `/api/v1/drills/${drillId}`,
                'PATCH',
                request
            );
        } catch (error) {
            console.error('Error in updateDrill:', error);
            throw new Error('Could not update drill. Please try again later.');
        }
    }

    /**
     * Delete a drill
     */
    async deleteDrill(drillId: string): Promise<void> {
        try {
            await this.fetchWithAuth<void>(`/api/v1/drills/${drillId}`, 'DELETE');
        } catch (error) {
            console.error('Error in deleteDrill:', error);
            throw new Error('Could not delete drill. Please try again later.');
        }
    }
}

export default new DrillService();
