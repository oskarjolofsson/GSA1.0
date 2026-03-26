import { useEffect, useState } from "react";
import { verifyAdmin } from "@/features/admin/services/adminService";

interface UseAdminProps {
    isAdmin: boolean;
    loading: boolean;
    error: Error | null;
}

export function useAdmin(): UseAdminProps {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {

        const checkAdminStatus = async () => {
            try {
                setLoading(true);
                const result = await verifyAdmin();
                setIsAdmin(result);
            } catch (err) {
                console.error('Error checking admin status:', err);
                setError(err instanceof Error ? err : new Error('Failed to check admin status'));
            } finally {
                setLoading(false);
            }
        }

        checkAdminStatus();
    }, []);

    return { isAdmin, loading, error };

}