import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/api/authApi";

export default function LogOutButton() {
    const { user, loading } = useAuth();

    if (loading || !user) return null;

    return (
        <div className="flex select-none">
            <a
                onClick={signOut}
                className="flex items-center text-red-400 hover:text-red-500 cursor-pointer transition-colors duration-200"
            >
                <LogOut className="h-5 w-5 mr-2" />
                <span className="font-medium">Sign Out</span>
            </a>
        </div>
    );
}
