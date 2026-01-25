import { useState, useRef, useEffect } from "react";
import DropZone from "../../../components/fileUpload/DropZone";
import ErrorPopup from "../../../components/popup/ErrorPopup";

export default function UploadFileScreen({ 
  fileHandling, 
  errorMessage, 
  setErrorMessage,
  onFileSelected 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(timer);
  }, []);

  // Automatically advance to next screen when file is selected
  useEffect(() => {
    if (fileHandling.file && !fileHandling.isLoading) {
      onFileSelected();
    }
  }, [fileHandling.file, fileHandling.isLoading, onFileSelected]);

  const handleSelect = (files) => {
    try {
      fileHandling.handleFileSelection(files);
    } catch (err) {
      setErrorMessage(err.message);
      fileHandling.removeFile();
    }
  };

  const handleDrop = (e) => {
    setDragActive(false);
    try {
      fileHandling.handleDrop(e);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="h-auto text-slate-100 relative overflow-hidden py-12 min-h-screen">
      <section className="relative mx-auto max-w-6xl px-4 mt-16">
        <UploadHeader />
        
        <div className="gap-12">
          <DropZone
            file={fileHandling.file}
            dragActive={dragActive}
            setDragActive={setDragActive}
            ready={ready}
            inputRef={inputRef}
            onDrop={handleDrop}
            onSelect={handleSelect}
            onUpload={() => {}} // Not used in this screen
            uploading={fileHandling.isLoading}
          />
        </div>

        <ErrorPopup 
          message={errorMessage} 
          onClose={() => setErrorMessage("")} 
        />
      </section>
    </div>
  );
}

function UploadHeader() {
  return (
    <header className="mb-12 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
        Upload & Get Feedback
      </h1>
      <p className="mt-4 text-slate-400">
        Drop a single video below. We'll analyze it and return insights.
      </p>
    </header>
  );
}