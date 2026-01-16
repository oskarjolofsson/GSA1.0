import { useAuth } from "../../auth/authContext.jsx";
import { LogOut } from "lucide-react";

export default function LogOutButton() {
    const { user, loading, logout } = useAuth();
    let text = "";

    if (loading || !user) return null;


    return (
        <div className="flex select-none">
            <a
                onClick={logout}
                className="flex items-center text-red-400 hover:text-red-500 cursor-pointer transition-colors duration-200"
            >
                <LogOut className="h-5 w-5 mr-2" /><span className="font-medium">Sign Out</span>
            </a>
        </div>
    );
}
