import { apiClient } from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type {
    Drill,
    CreateDrillRequest,
    CreateDrillResponse,
    UpdateDrillRequest
} from '../types';

export class DrillService {
    /**
     * Create a new drill
     */
    async createDrill(request: CreateDrillRequest): Promise<CreateDrillResponse> {
        return apiClient.post<CreateDrillResponse>(routes.drills.root, request);
    }

    /**
     * Get all drills associated with an issue
     */
    async getDrillsByIssue(issueId: string): Promise<Drill[]> {
        const data = await apiClient.get<Drill[]>(routes.drills.byIssue(issueId));
        return Array.isArray(data) ? data : [];
    }

    /**
     * Get all drills (admin endpoint)
     */
    async getAllDrills(): Promise<Drill[]> {
        const data = await apiClient.get<Drill[]>(routes.drills.all);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Update a drill
     */
    async updateDrill(drillId: string, request: UpdateDrillRequest): Promise<Drill> {
        return apiClient.patch<Drill>(routes.drills.byId(drillId), request);
    }

    /**
     * Delete a drill
     */
    async deleteDrill(drillId: string): Promise<void> {
        await apiClient.delete<void>(routes.drills.byId(drillId));
    }

    /**
     * Bulk delete drills
     */
    async bulkDeleteDrills(drillIds: string[]): Promise<void> {
        await apiClient.delete<void>(routes.drills.bulk, { drill_ids: drillIds });
    }
}

export default new DrillService();
