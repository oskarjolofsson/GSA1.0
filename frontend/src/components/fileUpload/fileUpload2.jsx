import { useState, useRef, useEffect } from "react";
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
import tokenService from "../../services/tokenService.js";
import SubscriptionService from "../../services/activeSubscription.js";
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
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tokenCount, setTokenCount] = useState(null);
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showOutOfTokensPopup, setShowOutOfTokensPopup] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasActive = await SubscriptionService.getActiveSubscription();
        if (mounted) setHasSubscription(hasActive);

        if (!hasActive) {
          const count = await tokenService.getBalance();
          if (mounted) setTokenCount(count);
        }
      } catch (e) {
        console.error('Error fetching token balance:', e);
        if (mounted) setErrorMessage('Could not fetch token balance');
      }
    })();
    return () => { mounted = false; };
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

    // Clear any previous error before starting a new upload
    setErrorMessage("");
    setUploading(true);

    try {
      // Validate file integrity before upload (prevents mobile corruption)
      const validatedFile = await validateAndPrepareFile(file);

      const form = new FormData();
      form.append("video", validatedFile);
      // include optional user note/caption when present
      if (note && note.trim().length) {
        form.append("note", note.trim());
      }
      form.append("start_time", String(startTime));
      form.append("end_time", String(endTime));

      // Get user_id from tokenService (adjust this line to your actual implementation)
      const userId = tokenService.getUserId(); // Make sure this returns the user ID
      form.append("user_id", userId);

      const res = await fetch(API + "/api/v1/analysis/upload_video", {
        method: "POST",
        body: form,
      });

      // ///////////////// ONLY FOR TESTING - MOCK request ///////////////// //
      // const res = await fetch(API + "/api/v1/analysis/test_analysis_output", {
      //   method: "GET",
      // });
      // ///////////////// ONLY FOR TESTING - MOCK request ///////////////// //

      if (!res.ok) {
        let backendMessage = "Upload failed";
        try {
          const errorData = await res.json();
          // backend returns { success: false, error: 'message' }
          backendMessage = errorData.message || errorData.error || backendMessage;
        } catch {
          const text = await res.text();
          if (text) backendMessage = text;
        }
        // surface error to the user via popup
        setErrorMessage(backendMessage);
        throw new Error(backendMessage);
      }

      // Update the token count after successful upload
      try {
        const updatedCount = await tokenService.getBalance();
        setTokenCount(updatedCount);
      } catch (e) {
        console.error('Error updating token balance after upload:', e);
      }

      const data = await res.json();

      setAnalysis(data.analysis_results);
      console.log("Analysis results:", data.analysis_results);
    } catch (err) {
      setAnalysis(null);
      // Show error message - either from backend response or file validation failure
      setErrorMessage(err.message || "Upload failed");
    }

    setUploading(false);
  }

  return (
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
                    file={file}
                    note={note}
                    setNote={setNote}
                    onTime={onTime}
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
  );
}
