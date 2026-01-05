import { useState, useEffect } from "react";
import { Copy, Facebook, Linkedin, X } from "lucide-react";

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

  const shareOnFacebook = () => {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookShareUrl, "facebook-share", "width=600,height=400");
  };

  const shareOnX = () => {
    const text = "Check out my golf swing analysis!";
    const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xShareUrl, "x-share", "width=600,height=400");
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
          <div className="grid grid-cols-3 gap-3">
            {/* Facebook */}
            <button
              onClick={shareOnFacebook}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on Facebook"
            >
              <Facebook size={24} className="text-blue-600" />
              <span className="text-xs">Facebook</span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={shareOnX}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on X"
            >
              <X size={24} className="text-slate-400" />
              <span className="text-xs">X</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={shareOnLinkedIn}
              className="flex flex-col items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 p-3 rounded-lg transition-colors duration-200"
              aria-label="Share on LinkedIn"
            >
              <Linkedin size={24} className="text-blue-500" />
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
