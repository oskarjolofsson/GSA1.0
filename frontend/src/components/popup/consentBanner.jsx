import { setAnalyticsConsent, hasUserGivenConsent } from "../../lib/consent";
import { useState } from "react";

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(!hasUserGivenConsent());

  const handleAcceptCookies = () => {
    setAnalyticsConsent(true);
    setShowBanner(false);
  };

  const handleDeclineCookies = () => {
    setAnalyticsConsent(false);
    setShowBanner(false);
  };

  return (
    <div>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 shadow-lg z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 sm:gap-6">
            <p className="text-sm text-slate-300 flex-1">
              Allow us to collect anonymous usage analytics to improve the service
            </p>
            <div className="flex gap-3 flex-shrink-0">
              <button type="button" onClick={handleAcceptCookies} className="whitespace-nowrap rounded-lg bg-emerald-500/90 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors">Accept analytics</button>
              <button type="button" onClick={handleDeclineCookies} className="whitespace-nowrap rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}