import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";

export default function RequireAuth() {
    const {user, loading} = useAuth();
    if (loading) return null;
    return user ? <Outlet /> : <Navigate to="/login" replace />
}