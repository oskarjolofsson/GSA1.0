import { useState, useEffect, useRef, useCallback } from "react";
import { useValidationState } from "../hooks/useValidationState.js";
import { useUploadState } from "../hooks/useUploadState.js";
import uploadService from "../services/uploadService.js";
import { ValidationProvider, useValidation } from "../../../context/ValidationContext.jsx";
import { Scissors, ArrowRight } from "lucide-react";

// Custom hooks
import { useVideoMetadata } from "../hooks/useVideoMetadata.js";
import { useVideoSeek } from "../hooks/useVideoSeek.js";
import { useVideoTrimming } from "../hooks/useVideoTrimming.js";

// Components
import UploadButtonZone from "../components/UploadButton.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import TrimSlider from "../components/TrimSlider.jsx";
import TrimStats from "../components/TrimStats.jsx";
import Dropdown from "../components/Dropdown.jsx";
import AdvancedSettings from "../components/AdvancedSettings.jsx";
import ErrorPopup from "../../../shared/components/popup/ErrorPopup.jsx";

// Constants
import { VIDEO_CONSTANTS } from "../constants/videoConstants.js";

function TrimVideoScreenContent({
    fileHandling,
    promptConfig,
    setStartTime,
    setEndTime,
    onRemoveFile,
    onAnalyzing,
}) {
    const [ready, setReady] = useState(false);
    const [shouldOpenAdvanced, setShouldOpenAdvanced] = useState(false);
    const dropdownRef = useRef(null);
    const validation = useValidation();

    // Video metadata and state
    const { videoRef, duration, isLoaded, error: videoError } = useVideoMetadata(fileHandling.previewUrl);
    
    // Trimming state
    const trimState = useVideoTrimming(duration, (start, end) => {
        setStartTime(start);
        setEndTime(end);
    });

    // Video seeking
    const seekTo = useVideoSeek(videoRef);

    // Video upload state and service
    const uploadState = useUploadState();

    useEffect(() => {
        const timer = setTimeout(() => setReady(true), 30);
        return () => clearTimeout(timer);
    }, []);

    // Sync validation errors from trim state
    useEffect(() => {
        if (trimState.validation.errors.trim) {
            validation.setValidationError('trim', trimState.validation.errors.trim);
        } else {
            validation.clearValidationError('trim');
        }

        if (trimState.validation.errors.duration) {
            validation.setValidationError('duration', trimState.validation.errors.duration);
        } else {
            validation.clearValidationError('duration');
        }
    }, [trimState.validation, validation]);

    // Navigate to analyzing screen when upload completes
    useEffect(() => {
        if (uploadState.analysis && uploadState.analysisId && !uploadState.uploading) {
            onAnalyzing(uploadState.analysisId);
        }
    }, [uploadState.analysis, uploadState.analysisId, uploadState.uploading, onAnalyzing]);

    // Reset advanced settings trigger after opening
    useEffect(() => {
        if (shouldOpenAdvanced) {
            setShouldOpenAdvanced(false);
        }
    }, [shouldOpenAdvanced]);

    const handleTrimClose = () => {
        setShouldOpenAdvanced(true);
    };

    const handleRangeChange = useCallback((values) => {
        const prevStart = trimState.start;
        const prevEnd = trimState.end;

        trimState.setRange(values);

        // Jump to whichever handle moved
        if (Math.abs(values[0] - prevStart) > Math.abs(values[1] - prevEnd)) {
            seekTo(values[0]);
        } else {
            seekTo(values[1]);
        }
    }, [trimState, seekTo]);

    const handleConfirmTrim = () => {
        if (dropdownRef.current) {
            dropdownRef.current.close();
        }
        handleTrimClose();
    };

    async function handleUpload() {
        if (!fileHandling.file) return;
        if (uploadState.uploading) return;

        uploadState.setUploading(true);
        uploadState.setErrorMessage('');

        try {
            const result = await uploadService.uploadVideo(
                fileHandling.file,
                promptConfig.advancedInput,
                trimState.start,
                trimState.end,
                promptConfig.AImodel
            );
            uploadState.setAnalysis(result.analysis);
            uploadState.setAnalysisId(result.analysisId);
        } catch (err) {
            const errorMsg = err.message || 'Upload failed';
            uploadState.setErrorMessage(errorMsg);
        } finally {
            uploadState.setUploading(false);
        }
    }

    return (
        <div className="h-auto text-slate-100 relative overflow-hidden min-h-screen flex items-center justify-center py-10">
            <section className="relative mx-auto max-w-6xl px-4 mt-5">
                <div className="gap-12 mb-16">
                    <div
                        className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] max-w-[700px] mx-auto flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform md:rounded-3xl md:bg-[#0e1428]/80 md:backdrop-blur-md md:border md:border-white/10 md:p-6 rounded-none bg-transparent backdrop-blur-none border-none p-0 w-full ${
                            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        } delay-150`}
                    >
                        {!fileHandling.previewUrl ? (
                            <div className="text-slate-400 text-sm">No video selected</div>
                        ) : (
                            <div className="w-full h-full flex flex-col">
                                <VideoPlayer
                                    videoRef={videoRef}
                                    previewUrl={fileHandling.previewUrl}
                                    onRemove={onRemoveFile}
                                />

                                {/* User tip */}
                                <div className="mt-3 text-center">
                                    <p className="text-xs text-white/60">
                                        Tip: Trim the video so only the swing motion remains.
                                    </p>
                                </div>

                                {/* Trim controls dropdown */}
                                <div className="mt-4">
                                    <Dropdown
                                        ref={dropdownRef}
                                        icon={<Scissors className="w-4 h-4 text-white/70" />}
                                        name="Step 1: Trim Your Swing"
                                        isStep1={true}
                                        isInitiallyOpen={true}
                                        onClose={handleTrimClose}
                                        done={duration > 0 && trimState.trimmedLength <= VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH}
                                        requirement={"Video too long, please trim"}
                                    >
                                        {/* Helper text */}
                                        <div className="text-xs text-white/60 mb-3">
                                            Select only the swing motion. This is required for accurate analysis.
                                        </div>

                                        {/* Trim Slider */}
                                        <TrimSlider
                                            start={trimState.start}
                                            end={trimState.end}
                                            duration={duration}
                                            onChange={handleRangeChange}
                                            isInvalid={trimState.trimmedLength > VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH}
                                        />

                                        {/* Trim Stats */}
                                        <TrimStats
                                            trimmedLength={trimState.trimmedLength}
                                            isValid={trimState.trimmedLength <= VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH}
                                        />

                                        {/* Confirm button */}
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={handleConfirmTrim}
                                                disabled={trimState.trimmedLength > VIDEO_CONSTANTS.MAX_TRIMMED_LENGTH}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm Trim
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </Dropdown>
                                </div>

                                {/* Advanced Settings */}
                                <AdvancedSettings
                                    advancedInput={promptConfig.advancedInput}
                                    setAdvancedInput={promptConfig.setAdvancedInput}
                                    shouldOpen={shouldOpenAdvanced}
                                />
                            </div>
                        )}
                    </div>

                    <UploadButtonZone
                        onUpload={handleUpload}
                        uploading={uploadState.uploading}
                    />
                </div>

                <ErrorPopup message={uploadState.errorMessage || videoError} onClose={() => uploadState.setErrorMessage("")} />
            </section>
        </div>
    );
}

export default function TrimVideoScreen(props) {
    const validationState = useValidationState();

    return (
        <ValidationProvider validationState={validationState}>
            <TrimVideoScreenContent {...props} />
        </ValidationProvider>
    );
}
