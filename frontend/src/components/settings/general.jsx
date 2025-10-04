import { logout } from "../../auth/auth";
import { useAuth } from "../../auth/authContext";

function logOutButton() {
  const { user, loading, logout } = useAuth();
  let text = "";

  if (loading || !user) return null;

  return (
    <button
      onClick={() => {
        logout();
        window.location.href = "/";
      }}
      className="mt-4 inline-flex items-center text-red-500 font-bold hover:text-red-600 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Logout
    </button>
  );

}

export default function GeneralTab({ user }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">General</h3>
      
      {logOutButton()}
    </div>
  );
}