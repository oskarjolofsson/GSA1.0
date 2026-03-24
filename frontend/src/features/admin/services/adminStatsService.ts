import { apiClient } from '@/lib/apiClient';
import type { AdminStats } from '../types';

export class AdminStatsService {
    async getStats(): Promise<AdminStats> {
        return apiClient.get<AdminStats>('/api/v1/admin/stats/');
    }
}

const adminStatsService = new AdminStatsService();
export default adminStatsService;
