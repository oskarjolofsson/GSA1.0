import VideoWithSlider from "./VideoWithSlider";
import Dropdown from "../Dropdown";
import { Settings } from "lucide-react";

export default function PreviewPane({ previewUrl, ready, uploading, onRemove, file, note, setNote, onTime, advancedInput, setAdvancedInput }) {
  return (
    <div
      className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] max-w-[700px] mx-auto flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } delay-150`}
    >
      {!previewUrl ? (
        <div className="text-slate-400 text-sm">No video selected</div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <VideoWithSlider previewUrl={previewUrl} onTime={onTime} onRemove={onRemove} />

          {/* Dropdown for advanced settings */}
          <Dropdown icon={<Settings className="w-4 h-4 text-white/70" />} name="Advanced Settings">
            <p>Hellop</p>
          </Dropdown>
        </div>
      )}
    </div>
  );
}