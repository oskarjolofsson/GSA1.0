import { useState, useRef, useEffect } from "react";
const API = import.meta.env.VITE_API_URL;

// Components
import ResultBox from "../result-box/result-box.jsx";
import ErrorPopup from "../errorPopup/ErrorPopup.jsx";
import tokenService from "../../services/tokenService";
import { v4 as uuidv4 } from 'uuid';


function UploadHeader() {
  return (
    <header className="mb-12 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">Upload & Get Feedback</h1>
      <p className="mt-4 text-slate-400">Drop a single video below. We’ll analyze it and return insights.</p>
    </header>
  );
}

function DropZone({
  file,
  dragActive,
  setDragActive,
  ready,
  inputRef,
  onDrop,
  onSelect,
  onUpload,
  uploading,
  tokenCount,
}) {
  function handleDragOver(e) {
    e.preventDefault();
    if (!file) setDragActive(true);
  }

  function handleChange(e) {
    if (!file) onSelect(e.target.files);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={`rounded-3xl border-2 border-dashed p-10 text-center backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out will-change-transform transform ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${dragActive ? "border-emerald-400 bg-emerald-400/5" : "border-white/10 bg-[#0e1428]/70"}`}
    >
      <input
        ref={inputRef}
        id="video-input"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleChange}
      />

      <label htmlFor="video-input" className="cursor-pointer block">
        <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-white/5 ring-1 ring-white/10">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="mt-6 text-slate-200 font-semibold">Drop your video here or click to browse</p>
        <p className="text-sm text-slate-400 mt-1">Max one file • MP4, MOV, etc.</p>
      </label>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-white/5 px-5 py-2 ring-1 ring-white/10 hover:bg-white/10"
          disabled={!!file}
        >
          Choose file
        </button>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300 mr-2">Tokens: <span className="font-medium">{tokenCount ?? '—'}</span></div>
          <button
            type="button"
            onClick={onUpload}
            disabled={!file || uploading}
            className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold"
            aria-busy={uploading}
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90"></span>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewPane({ previewUrl, ready, uploading, onRemove, file }) {
  return (
    <div
      className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 min-h-[280px] flex items-center justify-center transition-all duration-700 ease-out will-change-transform transform ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } delay-150`}
    >
      {!previewUrl ? (
        <div className="text-slate-400 text-sm">No video selected</div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <video
              className="max-h-64 w-full rounded-2xl ring-1 ring-white/10 object-contain"
                src={previewUrl}
                controls
              />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-400 truncate">{file?.name}</div>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                viewBox="0 0 24 24"

  
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisResult({ analysis }) {
  if (!analysis) return null;
  return (
    <ResultBox
      title="Analysis Result"
      summary={analysis?.summary}
      drills={analysis?.drills}
      observations={analysis?.observations}
      phase_notes={analysis?.phase_notes}
    />
  );
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tokenCount, setTokenCount] = useState(null);

  useEffect(() => {
    // cleanup preview URL
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const count = await tokenService.getBalance();
        if (mounted) setTokenCount(count);
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
    if (!f.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return; // ignore drops while uploading
    if (file) return; // max one file
    onSelect(e.dataTransfer.files);
  }

  function onRemove() {
    if (uploading) return;
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onUpload() {
    if (!file) return; // Exit if no file is selected
    if (uploading) return;

    // Clear any previous error before starting a new upload
    setErrorMessage("");
    setUploading(true);

    // Before uploading, verify user has tokens and spend one atomically
    const idempotencyKey = uuidv4();
    try {
      const resp = await tokenService.verifyAndSpend(1, 'analysis_upload', idempotencyKey);
      if (!resp || !resp.success) {
        const msg = resp?.error || resp?.message || 'Insufficient tokens';
        setErrorMessage(msg);
        setUploading(false);
        return;
      }
      // Update local tokenCount from response if provided
      if (resp.transaction?.remaining_balance !== undefined) {
        setTokenCount(resp.transaction.remaining_balance);
      } else if (resp.remaining_tokens !== undefined) {
        setTokenCount(resp.remaining_tokens);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Token verification failed');
      setUploading(false);
      return;
    }

    const form = new FormData();
    form.append("video", file);

    try {
      const res = await fetch(API + "/api/v1/analysis/upload_video", {
        method: "POST",
        body: form,
      });
      

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

              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="text-xs text-slate-300 mr-2">Tokens: <span className="font-medium">{tokenCount ?? '—'}</span></div>
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={!file || uploading}
                  className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold"
                  aria-busy={uploading}
                >
                  {uploading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/90"></span>
                      Uploading...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
      const data = await res.json();

      const summary = data.analysis_results?.summary ?? "Could not be found";
      const drills = data.analysis_results?.drills ?? [];
      const observations = data.analysis_results?.observations ?? [];
      const phase_notes = data.analysis_results?.phase_notes ?? {};

      setAnalysis({ summary, drills, observations, phase_notes });
    } catch (err) {
      setAnalysis(null);
      // err.message already set in setErrorMessage above for known backend responses,
      // but ensure we show something if parsing failed
      if (!errorMessage) setErrorMessage(err.message || "Upload failed");
    }

    setUploading(false);
  }

  return (
    <div className="text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        <UploadHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
            tokenCount={tokenCount}
          />

          <PreviewPane
            previewUrl={previewUrl}
            ready={ready}
            uploading={uploading}
            onRemove={onRemove}
            file={file}
          />
        </div>

        <AnalysisResult analysis={analysis} />
        <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />
      </section>
    </div>
  );
}
