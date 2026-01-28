import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../auth/authContext.jsx"; // exposes { user, loading }
import { useNavigate } from "react-router-dom";

export default function SignInPopup({
  onStartSignIn,         // () => Promise<void> | void  (start your sign-in flow)
  onClose,               // optional callback when the popup is closed (backdrop / escape)
  title = "Sign In",
  subtitle = "Get access to the best athletic trainer on the web",
  waitingText = "Waiting for you to finish sign-in in the other tab…",
  errorText = "Something went wrong. Please try again.",
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const primaryBtnRef = useRef(null);

  // Focus the primary button when the dialog opens
  useEffect(() => {
    primaryBtnRef.current?.focus();
  }, []);

  // If user appears, the parent guard will stop rendering this popup.
  const handleStart = async () => {
    setError("");
    try {
      const maybePromise = onStartSignIn?.();
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
      setWaiting(true);
    } catch (e) {
      setWaiting(false);
      setError(errorText);
      // Optional: console.error(e);
    }
  };

  // If user appears (for example sign-in completed in another tab), notify parent to clear its show state
  useEffect(() => {
    if (user) {
      try { onClose?.(); } catch (e) { /* ignore */ }
    }
  }, [user, onClose]);

  const handleBackdropClick = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      // Notify parent that the popup is closing (so it can clear its show state)
      try { onClose?.(); } catch (e) { /* ignore errors from parent callback */ }
      navigate("/");
    }, 200);
  };

  // Close on Escape key with same animation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!closing) {
          setClosing(true);
          setTimeout(() => {
            try { onClose?.(); } catch (err) { /* ignore */ }
            navigate("/");
          }, 200);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closing, navigate]);

  // While auth state is unknown, show a tiny spinner (but keep dialog up)
  const isChecking = loading && !user;

  // Render into a portal (body) to ensure it overlays everything
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${closing ? "pointer-events-none" : ""}`}
      aria-live="polite"
      aria-busy={isChecking || waiting ? "true" : "false"}
    >
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${closing ? "opacity-0 pointer-events-none": "opacity-100"}`}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative mx-4 w-full max-w-md rounded-2xl bg-neutral-900/95 ring-1 ring-white/10 shadow-2xl p-6 text-white transition-all duration-200 transform ${closing ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-white/70">{subtitle}</p>
          </div>
        </div>

        {/* State area */}
        <div className="space-y-3">

          {(isChecking || waiting) && !user && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white/90" aria-hidden />
              <div className="text-sm">
                {waiting ? waitingText : "Checking your session…"}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300 ring-1 ring-red-500/30">
              {error}
            </div>
          )}

          {/* Actions */}
          {!user && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={handleStart}
                disabled={isChecking || waiting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-medium shadow hover:bg-white/90 disabled:opacity-60"
              >
                <>
                  <span aria-hidden="true" className="inline-block">
                    <svg aria-hidden="true" focusable="false" className="h-4 w-4" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611 20.083h-1.892V20H24v8h11.303c-1.648 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.084 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.652-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.655 16.591 18.961 14 24 14c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.084 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.152 0 9.771-1.977 13.285-5.197l-6.143-5.203C29.074 35.091 26.671 36 24 36c-5.202 0-9.611-3.317-11.271-7.946l-6.503 5.017C9.61 39.662 16.25 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083h-1.892V20H24v8h11.303c-.805 2.274-2.293 4.211-4.158 5.6l.003-.002 6.143 5.203C39.26 35.805 44 30.5 44 24c0-1.341-.138-2.652-.389-3.917z"/>
                    </svg>
                  </span>
                  <span>{waiting ? "Continue in the other tab…" : "Continue with Google"}</span>
                </>
              </button>
            </div>
          )}

          {/* Success hint (very brief; parent will unmount us) */}
          {user && (
            <p className="text-sm text-emerald-300">
              Signed in — loading your app…
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
