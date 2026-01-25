import { useState, useEffect } from "react";
import { Copy } from "lucide-react";

export default function SharePopup({ shareUrl, onClose }) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareOnX = () => {
    const text = "Check out my golf swing analysis!";
    const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xShareUrl, "x-share", "width=600,height=400");
  };

  const shareOnReddit = () => {
    const redditShareUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=Check%20out%20my%20golf%20swing%20analysis!`;
    window.open(redditShareUrl, "reddit-share", "width=600,height=400");
  };

  const shareOnFacebook = () => {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookShareUrl, "facebook-share", "width=600,height=400");
  };

  const shareOnLinkedIn = () => {
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInShareUrl, "linkedin-share", "width=600,height=400");
  };

  if (!shareUrl) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        showAnimation ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-slate-700 transition-transform duration-300 ${
          showAnimation ? "scale-100" : "scale-95"
        }`}
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4">Share Your Analysis</h2>

        {/* Share Link Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none cursor-text"
            />
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Copy size={18} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Social Media Share Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-300 mb-3">Share on Social Media</p>
          <div className="grid grid-cols-4 gap-2">
            {/* Facebook */}
            <button
              onClick={shareOnFacebook}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on Facebook"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.5 1.6-1.5H16.7V5.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V11H6.7v3h2.8v8h4z" />
              </svg>
              <span className="text-xs">Facebook</span>
            </button>

            {/* Reddit */}
            <button
              onClick={shareOnReddit}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on Reddit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 -4 48 48"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M31.14 26.326c-1.794 0-3.302-1.442-3.302-3.22 0-1.777 1.508-3.267 3.302-3.267s3.249 1.49 3.249 3.267c0 1.778-1.455 3.22-3.249 3.22m.762 6.248c-1.671 1.655-4.248 2.459-7.878 2.459l-.025-.002-.026.002c-3.63 0-6.205-.804-7.875-2.459a1.29 1.29 0 0 1 0-1.837 1.32 1.32 0 0 1 1.854 0c1.152 1.142 3.121 1.698 6.021 1.698l.026.001.025-.001c2.9 0 4.87-.556 6.024-1.698a1.32 1.32 0 0 1 1.854 0c.511.509.511 1.33 0 1.837m-18.291-9.468c0-1.776 1.504-3.267 3.297-3.267s3.249 1.491 3.249 3.267c0 1.778-1.455 3.22-3.249 3.22-1.793 0-3.297-1.442-3.297-3.22M39.996 2.598c1.215 0 2.203.98 2.203 2.182a2.196 2.196 0 0 1-2.203 2.183 2.196 2.196 0 0 1-2.203-2.183c0-1.202.988-2.182 2.203-2.182M48 19.57c0-3.152-2.587-5.716-5.769-5.716a5.77 5.77 0 0 0-3.635 1.283c-3.517-2.191-7.981-3.511-12.766-3.79l2.496-7.82 6.86 1.6c.18 2.476 2.267 4.435 4.81 4.435 2.66 0 4.824-2.145 4.824-4.782 0-2.635-2.165-4.78-4.824-4.78a4.84 4.84 0 0 0-4.283 2.582l-7.97-1.86a1.31 1.31 0 0 0-1.55.873L23.094 11.3c-5.156.124-10.002 1.449-13.777 3.767a5.77 5.77 0 0 0-3.548-1.214C2.587 13.854 0 16.418 0 19.57c0 1.949.99 3.672 2.497 4.703q-.095.68-.095 1.372c0 3.94 2.311 7.606 6.508 10.32C12.933 38.567 18.258 40 23.903 40s10.969-1.433 14.992-4.035c4.197-2.714 6.509-6.38 6.509-10.32q-.001-.63-.082-1.253C46.931 23.377 48 21.595 48 19.57"
                />
              </svg>
              <span className="text-xs">Reddit</span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={shareOnX}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on X"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 1200 1227"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
              </svg>
              <span className="text-xs">X</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={shareOnLinkedIn}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on LinkedIn"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.846 3.37-1.846 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
              <span className="text-xs">LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 rounded-lg transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
