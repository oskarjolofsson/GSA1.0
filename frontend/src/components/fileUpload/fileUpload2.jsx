import { useState, useRef, useEffect } from "react";
import { useValidationState } from "../../hooks/useValidationState.js";
import { useSubscriptionAndTokens } from "../../hooks/useSubscriptionAndTokens.js";
import { useVideoUpload } from "../../hooks/useVideoUpload.js";
import { ValidationProvider } from "../../context/ValidationContext.jsx";
import tokenService from "../../services/tokenService.js";
const API = import.meta.env.VITE_API_URL;

// Helper to validate file integrity and format (prevents mobile corruption)
async function validateAndPrepareFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result;
      
      // Check for valid MP4 signature (ftyp box starts with 0x66747970)
      const view = new Uint8Array(arrayBuffer);
      const isMp4 = view.length > 8 && 
                    view[4] === 0x66 && view[5] === 0x74 && 
                    view[6] === 0x79 && view[7] === 0x70;
      
      // Check for WebM signature
      const isWebM = view.length > 4 && 
                     view[0] === 0x1A && view[1] === 0x45 && 
                     view[2] === 0xDF && view[3] === 0xA3;
      
      if (!isMp4 && !isWebM) {
        reject(new Error("Invalid video format. Please upload an MP4 or WebM file."));
        return;
      }
      
      // Create a fresh blob to ensure integrity
      const blob = new Blob([arrayBuffer], { type: file.type });
      const validatedFile = new File([blob], file.name, { 
        type: file.type,
        lastModified: file.lastModified 
      });
      resolve(validatedFile);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read video file. Please try again."));
    };
    
    reader.onabort = () => {
      reject(new Error("File reading was cancelled."));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Components
import DropZone from "./DropZone.jsx";
import PreviewPane from "./preview/PreviewPane.jsx";
import ResultBox from "./result-box.jsx";
import ErrorPopup from "../popup/ErrorPopup.jsx";
import OutOfTokensPopup from "../popup/OutOfTokensPopup.jsx";
import BubblePopGame from "../games/BublePopGame.jsx";
import UploadButtonZone from "./UploadButtonZone.jsx";
import Loading from "./loading.jsx";

function UploadHeader() {
  return (
    <header className="mb-12 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Upload & Get Feedback</h1>
      <p className="mt-4 text-slate-400">Drop a single video below. We'll analyze it and return insights.</p>
    </header>
  );
}

function AnalysisResult({ analysis }) {
  if (!analysis) return null;
  return (
    <ResultBox
      analysis={analysis}
    />
  );
}

export default function UploadPage({ initialFile }) {
  const [file, setFile] = useState(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [showOutOfTokensPopup, setShowOutOfTokensPopup] = useState(false);
  const [advancedInput, setAdvancedInput] = useState({

  });

  // Validation state for form validation
  const validationState = useValidationState();

  // Subscription and tokens hook
  const { tokenCount, hasSubscription, setTokenCount } = useSubscriptionAndTokens();

  // Video upload hook
  const { analysis, uploading, errorMessage, uploadVideo, setAnalysis, setErrorMessage } = useVideoUpload();

  function onTime(start, end) {
    setStartTime(start);
    setEndTime(end);
  }

  useEffect(() => {
    // If initialFile is provided, create a preview URL
    if (initialFile && !previewUrl) {
      const url = URL.createObjectURL(initialFile);
      setPreviewUrl(url);
      setFile(initialFile);
      return () => {
        // Only revoke if we're unmounting or if we create a new URL
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [initialFile]);

  useEffect(() => {
    // Cleanup preview URL only when component unmounts or file changes
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  function onSelect(files) {
    if (!files || !files.length) return;
    const f = files[0];
    
    // Validate file type
    if (!f.type.startsWith("video/")) {
        setErrorMessage("Please select a video file.");
        return;
    }

    setUploading(true);
    setErrorMessage("");

    // Validate file before preview
    validateAndPrepareFile(f)
        .then((validatedFile) => {
            setFile(validatedFile);
            
            // Create preview URL from validated file
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(validatedFile);
            setPreviewUrl(url);
            setNote("");
            setUploading(false);
        })
        .catch((err) => {
            setErrorMessage("Upload failed, try again");
            setUploading(false);
        });
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer?.files;
    if (!files || !files.length) return;
    
    const f = files[0];
    if (!f.type.startsWith("video/")) {
        setErrorMessage("Please select a video file.");
        return;
    }

    setUploading(true);
    setErrorMessage("");

    // Validate file before preview
    validateAndPrepareFile(f)
        .then((validatedFile) => {
            setFile(validatedFile);
            
            // Create preview URL from validated file
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(validatedFile);
            setPreviewUrl(url);
            setNote("");
            setUploading(false);
        })
        .catch((err) => {
            setErrorMessage("Upload failed, try again");
            setUploading(false);
        });
  }

  // Remove the selected file and clear state
  function onRemove() {
    if (uploading) return;
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    setNote("");
  }

  async function onUpload() {
    if (!file) return; // Exit if no file is selected
    if (uploading) return;

    // Check if user has no tokens and no subscription
    if (!hasSubscription && tokenCount === 0) {
      setShowOutOfTokensPopup(true);
      return;
    }

    try {
      // Validate file integrity before upload (prevents mobile corruption)
      const validatedFile = await validateAndPrepareFile(file);

      // Call the upload hook
      await uploadVideo(validatedFile, advancedInput, startTime, endTime, tokenCount, hasSubscription);

      // Update the token count after successful upload
      try {
        const updatedCount = await tokenService.getBalance();
        setTokenCount(updatedCount);
      } catch (e) {
        console.error('Error updating token balance after upload:', e);
      }
    } catch (err) {
      // Check if it's the out of tokens error
      if (err.message === 'OUT_OF_TOKENS') {
        setShowOutOfTokensPopup(true);
      } else {
        setErrorMessage(err.message || "Upload failed");
      }
    }
  }

  return (
    <ValidationProvider validationState={validationState}>
      <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        {uploading ? (
          <Loading time={40} full={!uploading} />   // Change time depending on model
        ) : !analysis ? (
          <>
            <UploadHeader />
            <div className="gap-12">
              {!file ? (
                <DropZone
                  file={file}
                  dragActive={dragActive}
                  setDragActive={setDragActive}
                  ready={ready}
                  inputRef={inputRef}
                  onDrop={onDrop}
                  onSelect={onSelect}
                  onUpload={onUpload}
                  uploading={uploading}
                  tokenCount={hasSubscription ? "∞" : tokenCount}
                />) : (
                <>
                  <PreviewPane
                    previewUrl={previewUrl}
                    ready={ready}
                    uploading={uploading}
                    onRemove={onRemove}
                    onTime={onTime}
                    advancedInput={advancedInput}
                    setAdvancedInput={setAdvancedInput}
                  />
                  <UploadButtonZone
                    onUpload={onUpload}
                    uploading={uploading}
                    tokenCount={hasSubscription ? "∞" : tokenCount}
                    file={file}
                  />
                </>
              )}

            </div>
          </>
        ) : (
          <AnalysisResult analysis={analysis} />
        )}

        <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />
        <OutOfTokensPopup isOpen={showOutOfTokensPopup} onClose={() => setShowOutOfTokensPopup(false)} />
      </section>
    </div>
    </ValidationProvider>
  );
}
