import { type DbUser } from "../types";
import { apiClient } from '@/lib/apiClient';

export class UserService {
    async getAllUsers(): Promise<DbUser[]> {
        return apiClient.get<DbUser[]>('/api/v1/users/all/');
    }
}