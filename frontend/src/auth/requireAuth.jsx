import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";
import SignInPopup from "../components/popup/signInPopup.jsx";
import { login } from "./auth.js"

export default function RequireAuth() {
    const {user, loading} = useAuth();
    if (loading) return null;

    if (!user) {
        return <SignInPopup onStartSignIn={login} />;
    }

    return <Outlet />;
}