import { useState } from "react";
import { Settings } from "lucide-react";

export default function AdvancedSettings({ advancedInput, setAdvancedInput }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 300);
    } else {
      setIsOpen(true);
      setIsVisible(true);
    }
  };

  const handleInputChange = (field, value) => {
    setAdvancedInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasFilledFields = Object.values(advancedInput || {}).some(
    (val) => val && String(val).trim().length > 0
  );

  return (
    <div className="mt-4">
      <button
        onClick={handleToggle}
        className={`w-full px-4 py-3 border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/90 font-medium shadow-md transition-all duration-200 flex items-center justify-between hover:border-white/50 ${
          !isOpen ? "blink-dropdown rounded-lg" : "rounded-t-lg border-b-0"
        }`}
      >
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-white/70" />
          <span className="font-bold">Advanced Settings</span>
          {hasFilledFields && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {Object.values(advancedInput).filter((v) => v).length} filled
            </span>
          )}
        </span>
        <span
          className={`transition-transform duration-300 text-white/60 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`p-6 rounded border border-t-0 border-white/20 bg-white/5 backdrop-blur-md shadow-lg space-y-6 ${
            isVisible ? "dropdown-slide-down" : "dropdown-slide-up"
          }`}
        >
          {/* Ball & Course Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              Ball & Course
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., narrow fairway, wide fairway, rough..."
                value={advancedInput?.ballFieldType || ""}
                onChange={(e) => handleInputChange("ballFieldType", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Ball field type</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., straight, left bias, right bias..."
                value={advancedInput?.desiredBallField || ""}
                onChange={(e) => handleInputChange("desiredBallField", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Desired ball field</span>
            </div>
          </div>

          {/* Swing Metrics Section */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              Swing Metrics
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., high, low, medium..."
                value={advancedInput?.currentStrikeHeight || ""}
                onChange={(e) => handleInputChange("currentStrikeHeight", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Current strike height</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., lower, higher, consistent..."
                value={advancedInput?.desiredStrikeHeight || ""}
                onChange={(e) => handleInputChange("desiredStrikeHeight", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Desired strike height</span>
            </div>
          </div>

          {/* Performance Section */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              Performance
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., slices right, hooks left, inconsistent..."
                value={advancedInput?.typicalMiss || ""}
                onChange={(e) => handleInputChange("typicalMiss", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Typical miss pattern</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="e.g., power, accuracy, consistency..."
                value={advancedInput?.strengths || ""}
                onChange={(e) => handleInputChange("strengths", e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-200"
              />
              <span className="text-xs text-white/50">Key strengths</span>
            </div>
          </div>

          {/* Helper Text */}
          <div className="border-t border-white/10 pt-4 text-xs text-white/50">
            <p>All fields are optional. Provide details to get more targeted AI feedback.</p>
          </div>
        </div>
      )}
    </div>
  );
}
