import { useState, useEffect, useRef } from "react";
import { Settings, ArrowRight, SkipForward } from "lucide-react";
import Dropdown from "../../Dropdown";

/**
 * @typedef {object} Step2State
 * @property {'ShotShape' | 'TypicalMiss' | 'ExtraFocus'} activeCategory
 * @property {'straight' | 'fade' | 'draw' | 'unsure'} [shape]
 * @property {'slice' | 'hook' | 'thin' | 'fat' | 'inconsistent' | 'unsure'} [miss]
 * @property {string} [extra]
 */

export default function AdvancedSettings({ advancedInput, setAdvancedInput, shouldOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [state, setState] = useState({
    activeCategory: "ShotShape",
    shape: 'unsure',
    miss: 'unsure',
    extra: '',
  });

  const [category, setCategory] = useState("ShotShape");

  // Auto-open when parent signals (e.g., when trimming closes)
  const handleAutoOpen = () => {
    dropdownRef.current.open();
    setIsOpen(true);
  };

  // Watch for shouldOpen prop change
  useEffect(() => {
    if (shouldOpen && !isOpen) {
      handleAutoOpen();
    }
  }, [shouldOpen, isOpen]);


  return (
    <Dropdown
      ref={dropdownRef}
      name="Step 2: Advanced Settings"
      icon={<Settings className="w-4 h-4 text-white/70" />}
    >
      {/* Category Selector Tabs */}
      <div className="flex gap-2 mb-4">
        <CategoryTab
          label="Shape"
          isActive={category === "ShotShape"}
          onClick={() => setCategory("ShotShape")}
        />
        <CategoryTab
          label="Miss"
          isActive={category === "TypicalMiss"}
          onClick={() => setCategory("TypicalMiss")}
        />
        <CategoryTab
          label="Extra"
          isActive={category === "ExtraFocus"}
          onClick={() => setCategory("ExtraFocus")}
        />
      </div>

      {/* Answers Section Header */}
      <div className="text-xs text-white/60 font-medium mb-3 pb-2 border-b border-white/10">
        Answers
      </div>

      {/* Category Content */}
      {category === "ShotShape" && (
        <ShotShapeOptions
          value={state.shape || 'unsure'}
          onChange={(shape) => setState({ ...state, shape })}
        />
      )}

      {category === "TypicalMiss" && (
        <TypicalMissOptions
          value={state.miss || 'unsure'}
          onChange={(miss) => setState({ ...state, miss })}
        />
      )}

      {category === "ExtraFocus" && (
        <ExtraFocusInput
          value={state.extra || ''}
          onChange={(extra) => setState({ ...state, extra })}
        />
      )}

      {/* Step 2 Footer */}
      <Step2Footer
        onContinue={() => {
          if (setAdvancedInput) {
            setAdvancedInput(state);
          }
        }}
        onSkip={() => {
          // Reset and close
          dropdownRef.current.close();
        }}
      />
    </Dropdown>
  );
}

// Category Tab Button
function CategoryTab({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-white/20 text-white"
          : "bg-white/10 text-white/60 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

// Shot Shape Options
function ShotShapeOptions({ value, onChange }) {
  const options = [
    { key: 'straight', label: 'Straight' },
    { key: 'fade', label: 'Fade' },
    { key: 'draw', label: 'Draw' },
    { key: 'unsure', label: 'Unsure' },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
            value === opt.key
              ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
              : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Typical Miss Options
function TypicalMissOptions({ value, onChange }) {
  const options = [
    { key: 'slice', label: 'Slice' },
    { key: 'hook', label: 'Hook' },
    { key: 'thin', label: 'Thin' },
    { key: 'fat', label: 'Fat' },
    { key: 'inconsistent', label: 'Inconsistent' },
    { key: 'unsure', label: 'Unsure' },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${
            value === opt.key
              ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
              : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Extra Focus Input
function ExtraFocusInput({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add any additional focus or notes..."
      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
      rows={4}
    />
  );
}

// Step 2 Footer
function Step2Footer({ onContinue, onSkip }) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
      <button
        onClick={onSkip}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm font-medium transition-colors"
      >
        <SkipForward className="w-4 h-4" />
        Skip
      </button>
      <button
        onClick={onContinue}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
