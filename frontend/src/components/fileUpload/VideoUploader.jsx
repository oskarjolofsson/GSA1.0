import React, { useState, useRef } from "react";
import "./VideoUploader.css";

// Main functional component
export default function VideoUploader() {
  // State to track if the drag-and-drop area is active
  const [dragActive, setDragActive] = useState(false);
  // State to hold the uploaded file information
  const [uploadedFile, setUploadedFile] = useState(null);
  // Create a ref for the file input
  const fileInputRef = useRef(null);  

  // Handler for drag events to toggle the dragActive state
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handler for drop events to handle file drop actions
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handler for file input changes to handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Function to process and store the uploaded file
  const handleFileUpload = (file) => {
    setUploadedFile(file);
  };

  // Function to remove the uploaded file and reset the state
  const handleFileDelete = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = () => {  // Step 2: Create navigation handler
    if (uploadedFile) {
      navigate("/results");  // Change '/results' to your actual results page path
    }
  };

  return (
    <div className="uploader">
      <form
        className={`upload-box ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="file"
          id="fileInput"
          className="file-input"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploadedFile !== null}
          ref={fileInputRef}
        />
        <label
          htmlFor="fileInput"
          className={`upload-label ${uploadedFile ? "disabled" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <img
              src="/icons/upload_icon.svg"
              alt="Upload icon"
              className="upload-icon"
            />
            <p>Drag & drop your swing video here, or browse</p>
          </div>
        </label>
      </form>
      {uploadedFile && (
        <div className="uploaded-file-info">
          <button className="delete-button" onClick={handleFileDelete}>✖</button>
          <span className="file-name">
            {uploadedFile.name}
          </span>
          <button className="analyze-button" onClick={handleAnalyze}>Analyze</button>
        </div>
      )}
    </div>
  );
}
