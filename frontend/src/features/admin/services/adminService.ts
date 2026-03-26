import { apiClient } from '@/lib/apiClient';
import type { AdminStats, VerifyAdminResponse } from '../types';



export async function getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>('/api/v1/admin/stats/');
}

export async function verifyAdmin(): Promise<boolean> {
    try {
        const response : VerifyAdminResponse = await apiClient.get<VerifyAdminResponse>('/api/v1/admin/verify/');
        return response.is_admin;
    } 
    catch (error) {return false;}
}
