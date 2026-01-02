import { useState, useEffect, useRef } from "react";
import { Settings, ArrowRight, SkipForward, CheckCircle2 } from "lucide-react";
import Dropdown from "../../Dropdown";

export default function AdvancedSettings({ setAdvancedInput, shouldOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);  // Track if dropdown is open
  const dropdownRef = useRef(null);             // Ref to control Dropdown

  const [state, setState] = useState({
    activeCategory: "DesiredShot",
    shape: 'unsure',
    height: 'unsure',
    miss: ['unsure'],
    extra: '',
  });

  const [category, setCategory] = useState("DesiredShot");

  // Track which tabs are complete
  const [tabStatus, setTabStatus] = useState({
    DesiredShot: false,
    TypicalMiss: false,
    ExtraFocus: false,
  });

  // Check if all tabs are complete
  const allTabsComplete = Object.values(tabStatus).every((status) => status);

  // Update tab status whenever state changes
  useEffect(() => {
    setTabStatus({
      DesiredShot: state.shape !== 'unsure' || state.height !== 'unsure',
      TypicalMiss: Array.isArray(state.miss) ? state.miss.length > 0 && !state.miss.every(m => m === 'unsure') : state.miss !== 'unsure',
      ExtraFocus: state.extra.trim().length > 0,
    });
  }, [state]);

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
      name="Step 2: Tailor Your Feedback"
      icon={<Settings className="w-4 h-4 text-white/70" />}
      done={allTabsComplete}
      requirement={allTabsComplete ? "" : "Optional: Provide advanced shot details"}
    >
      {/* Category Selector Tabs */}
      <div className="flex gap-2 mb-4 justify-center">
        <CategoryTab
          label="Desired Shot"
          isActive={category === "DesiredShot"}
          isComplete={tabStatus.DesiredShot}
          onClick={() => setCategory("DesiredShot")}
        />
        <CategoryTab
          label="Miss Pattern"
          isActive={category === "TypicalMiss"}
          isComplete={tabStatus.TypicalMiss}
          onClick={() => setCategory("TypicalMiss")}
        />
        <CategoryTab
          label="Extra"
          isActive={category === "ExtraFocus"}
          isComplete={tabStatus.ExtraFocus}
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
          value={state.miss || []}
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
function CategoryTab({ label, isActive, isComplete, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isActive
        ? "bg-white/20 text-white"
        : "bg-white/10 text-white/60 hover:bg-white/15"
        }`}
    >
      {label}
      {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
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
      <div className="text-xs text-white/60 font-medium mb-2 text-center border-b border-white/10 pb-2">
        Select characteristics of your desired golf shot
      </div>

      {/* Shape Section */}
      <div>
        <div className="text-xs text-white/60 font-medium mb-3 text-center">Shape</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {shapeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onShapeChange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors text-center h-auto ${opt.key === 'unsure'
                  ? shape === opt.key
                    ? "bg-white/20 border border-white/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                  : shape === opt.key
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
      {/* <div>
        <div className="text-xs text-white/60 font-medium mb-3 text-center">Height</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {heightOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onHeightChange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors text-center h-auto ${
                opt.key === 'unsure'
                  ? height === opt.key
                    ? "bg-white/20 border border-white/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                  : height === opt.key
                  ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
}

// Typical Miss Options
function TypicalMissOptions({ value, onChange }) {
  const groups = [
    {
      name: 'Shot Shape',
      options: [
        { key: 'slice', label: 'Slice' },
        { key: 'hook', label: 'Hook' },
      ]
    },
    {
      name: 'Strike Quality',
      options: [
        { key: 'thin', label: 'Thin' },
        { key: 'fat', label: 'Fat' },
      ]
    },
    {
      name: 'Pattern',
      options: [
        { key: 'inconsistent', label: 'Inconsistent' }
      ]
    },
  ];

  const isSelected = (key) => Array.isArray(value) ? value.includes(key) : false;

  // Helper to find which group a key belongs to
  const getGroupForKey = (key) => {
    return groups.find(g => g.options.some(opt => opt.key === key));
  };

  const handleToggle = (key) => {
    if (key === 'unsure') {
      // If unsure is clicked, clear all others
      onChange(['unsure']);
    } else {
      // For regular options: handle group exclusivity
      let newValue = Array.isArray(value) ? [...value.filter((v) => v !== 'unsure')] : [];
      
      const group = getGroupForKey(key);
      
      if (isSelected(key)) {
        // If already selected, keep it selected (don't allow empty state)
        // Do nothing - just return
        return;
      } else {
        // Remove any other selections from the same group
        if (group) {
          newValue = newValue.filter((v) => !group.options.some(opt => opt.key === v));
        }
        // Add the new selection
        newValue.push(key);
      }

      onChange(newValue);
    }
  };

  const buttonClass = (key) => {
    const baseClass = 'px-4 py-2 rounded-lg text-sm transition-colors text-center h-auto w-full';

    if (key === 'unsure') {
      return `${baseClass} ${isSelected(key)
          ? "bg-white/20 border border-white/30 text-white"
          : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
        }`;
    }

    return `${baseClass} ${isSelected(key)
        ? "bg-emerald-500/30 border border-emerald-500/50 text-white"
        : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
      }`;
  };

  return (
    <div className="space-y-4">

      {/* Text to explain selection */}
      <div className="text-xs text-white/60 font-medium mb-2 text-center border-b border-white/10 pb-2">
        Select all that apply to your typical miss pattern.
      </div>

      {/* Group mapping */}
      {groups.map((group) => (
        <div key={group.name}>
          <div className="text-xs text-white/60 font-medium mb-3 text-center">{group.name}</div>
          <div className="flex justify-center gap-2">
            {group.options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleToggle(opt.key)}
                className={buttonClass(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Unsure */}
      <div>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleToggle('unsure')}
            className={buttonClass('unsure')}
          >
            Unsure
          </button>
        </div>
      </div>
    </div>
  );
}

// Extra Focus Input
function ExtraFocusInput({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Add any additional focus or notes about your golf swing..."
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
