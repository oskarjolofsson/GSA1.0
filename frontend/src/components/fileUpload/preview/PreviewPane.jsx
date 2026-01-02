import { useState, useEffect } from "react";
import VideoWithSlider from "./Trim/VideoWithSlider";
import AdvancedSettings from "./Advanced/AdvancedSettings";

export default function PreviewPane({ previewUrl, ready, uploading, onRemove, onTime, advancedInput, setAdvancedInput }) {
  const [shouldOpenAdvanced, setShouldOpenAdvanced] = useState(false);

  const handleTrimClose = () => {
    // When trim section closes, open advanced settings
    setShouldOpenAdvanced(true);
  };

  useEffect(() => {
    if (shouldOpenAdvanced) {
      setShouldOpenAdvanced(false);
    }
  }, [shouldOpenAdvanced]);

  return (
    <div
      className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] max-w-[700px] mx-auto flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform md:rounded-3xl md:bg-[#0e1428]/80 md:backdrop-blur-md md:border md:border-white/10 md:p-6 rounded-none bg-transparent backdrop-blur-none border-none p-0 w-full ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } delay-150`}
    >
      {!previewUrl ? (
        <div className="text-slate-400 text-sm">No video selected</div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <VideoWithSlider previewUrl={previewUrl} onTime={onTime} onRemove={onRemove} onTrimClose={handleTrimClose} />

          {/* Advanced Settings with structured fields */}
          <AdvancedSettings advancedInput={advancedInput} setAdvancedInput={setAdvancedInput} shouldOpen={shouldOpenAdvanced} />
        </div>
      )}
    </div>
  );
}