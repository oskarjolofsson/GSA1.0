import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import SignInPopup from "../shared/components/popup/signInPopup.jsx";
import { signIn } from "@/features/auth/api/authApi"

export default function RequireAuth() {
    const {user, loading} = useAuth();
    if (loading) return null;

    if (!user) {
        return <SignInPopup onStartSignIn={signIn} />;
    }

    return <Outlet />;
}