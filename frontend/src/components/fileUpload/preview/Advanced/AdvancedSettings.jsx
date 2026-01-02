import { useState, useEffect, useRef, use } from "react";
import { Settings, ArrowRight, SkipForward } from "lucide-react";
import Dropdown from "../../Dropdown";

export default function AdvancedSettings({ setAdvancedInput, shouldOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);  // Track if dropdown is open
  const dropdownRef = useRef(null);             // Ref to control Dropdown

  const [state, setState] = useState({
    activeCategory: "DesiredShot",
    shape: 'unsure',
    height: 'unsure',
    miss: 'unsure',
    extra: '',
  });

  const [category, setCategory] = useState("DesiredShot");

  // Sync state to parent
  useEffect(() => {
    if (setAdvancedInput) {
      setAdvancedInput(state);
    }
  }, [state]);

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
      done={false}
      requirement={"Optional: Provide advanced shot details"}
    >
      {/* Category Selector Tabs */}
      <div className="flex gap-2 mb-4">
        <CategoryTab
          label="Desired Shot"
          isActive={category === "DesiredShot"}
          onClick={() => setCategory("DesiredShot")}
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

      {/* Divider line */}
      <div className="border-t border-white/10 mb-4" />

      {/* Category Content */}
      {category === "DesiredShot" && (
        <DesiredShotOptions
          shape={state.shape || 'unsure'}
          height={state.height || 'unsure'}
          onShapeChange={(shape) => setState({ ...state, shape })}
          onHeightChange={(height) => setState({ ...state, height })}
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

          // Move to next step or close if none left
        if (category === "DesiredShot") {
            setCategory("TypicalMiss");
          } else if (category === "TypicalMiss") {
            setCategory("ExtraFocus");
          } else if (category === "ExtraFocus") {
            dropdownRef.current.close();
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
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
          ? "bg-white/20 text-white"
          : "bg-white/10 text-white/60 hover:bg-white/15"
        }`}
    >
      {label}
    </button>
  );
}

// Desired Shot Options (Shape and Height)
function DesiredShotOptions({ shape, height, onShapeChange, onHeightChange }) {
  const shapeOptions = [
    { key: 'straight', label: 'Straight' },
    { key: 'fade', label: 'Fade' },
    { key: 'draw', label: 'Draw' },
    { key: 'unsure', label: "Don't Know" },
  ];

  const heightOptions = [
    { key: 'low', label: 'Low' },
    { key: 'mid', label: 'Mid' },
    { key: 'high', label: 'High' },
    { key: 'unsure', label: "Don't Know" },
  ];

  return (
    <div className="space-y-4">
      {/* Shape Section */}
      <div>
        <div className="text-xs text-white/60 font-medium mb-3 text-center">Shape</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {shapeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onShapeChange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors text-center h-auto ${shape === opt.key
                  ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Height Section */}
      <div>
        <div className="text-xs text-white/60 font-medium mb-3 text-center">Height</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {heightOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onHeightChange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors text-center h-auto ${height === opt.key
                  ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add more details about your desired shot later if needed. */}
      
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
          className={`w-full px-4 py-2 rounded-lg text-sm text-left transition-colors ${value === opt.key
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
