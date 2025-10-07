import { useAuth } from "../../auth/authContext";
import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL;

function Balance() {
  const { user, loading } = useAuth();
  const [text, setText] = useState("");

  useEffect(() => {
    if (loading || !user) return;

    let aborted = false;

    const fetchBalance = async () => {
      try {
        const response = await fetch(`${API}/api/v1/tokens/balance`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.accessToken}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
          throw new Error(data?.error || "Failed to fetch token balance");
        }

        if (!aborted) {
          setText(
            typeof data.tokens === "number" && isFinite(data.tokens)
              ? `${data.tokens}`
              : "-"
          );
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
        if (!aborted) setText("Error fetching tokens");
      }
    };

    fetchBalance();

    return () => {
      aborted = true;
    };
  }, [user, loading]);

  if (loading) {
    setText("Loading...");
  }

  if (!user) return null;

  return (
    <div className="mt-4">
      <span className="font-medium inline-flex items-center gap-1">
      {/* Token Balance with logo: */}
      <span
        role="img"
        aria-label="Token"
        className="inline-block h-4 w-4 bg-emerald-500"
        style={{
          WebkitMask: 'url(/icons/token.svg) no-repeat center / contain',
          mask: 'url(/icons/token.svg) no-repeat center / contain',
        }}
      />
      <p className="text-green-500 font-bold">{text}</p>
      </span>
    </div>
  );
}

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
      
      <Balance />
      {logOutButton()}
    </div>
  );
}