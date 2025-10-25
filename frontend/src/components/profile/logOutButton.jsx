import { useAuth } from "../../auth/authContext.jsx";

export default function LogOutButton() {
    const { user, loading, logout } = useAuth();
    let text = "";

    if (loading || !user) return null;


    return (
        <div className="flex mt-4 select-none ml-4">
            <a
                onClick={logout}
                className="flex items-center text-red-400 hover:text-red-500 cursor-pointer transition-colors duration-200"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                <span className="font-medium">Sign Out</span>
            </a>
        </div>
    );
}
