import { apiClient } from '@/lib/apiClient';
import type { AdminStats } from '../types';



export async function getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>('/api/v1/admin/stats/');
}

export async function verifyAdmin(): Promise<boolean> {
    try {
        await apiClient.get('/api/v1/admin/is_admin/');
        return true;
    } catch (error) {
        return false;
    }
}
