import { useState } from "react";
import { Settings } from "lucide-react";

export default function Dropdown({
  children,
  icon,
  name,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleToggleDropdown = () => {
    if (isDropdownOpen) {
      setIsDropdownVisible(false);
      setTimeout(() => setIsDropdownOpen(false), 300);
    } else {
      setIsDropdownOpen(true);
      setIsDropdownVisible(true);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleToggleDropdown}
        className={`w-full px-4 py-3 border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/90 font-medium shadow-md transition-all duration-200 flex items-center justify-between hover:border-white/50 ${
          !isDropdownOpen ? "blink-dropdown rounded-lg" : "rounded-t-lg border-b-0"
        }`}
      >
        <span className="flex items-center gap-2">
          {icon || <Settings className="w-4 h-4 text-white/70" />}
          <span className="font-bold" >{name || "Name Error"}</span>
        </span>
        <span
          className={`transition-transform duration-300 text-white/60 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div
          className={`p-4 rounded border border-t-0 border-white/20 bg-white/5 backdrop-blur-md shadow-lg space-y-4 ${
            isDropdownVisible ? "dropdown-slide-down" : "dropdown-slide-up"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
