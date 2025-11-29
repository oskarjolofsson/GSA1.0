import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileTransferService } from '../../services/fileTransferService';

export default function DemoPreview() {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();

    function handleDragOver(e) {
        e.preventDefault();
        setIsDragging(true);
    }

    function handleDragLeave() {
        setIsDragging(false);
    }

    function handleFileSelection(file) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Please select a video file');
            return;
        }

        setError('');
        
        // Pass file to analyse page via service
        fileTransferService.setFile(file);
        navigate('/analyse');
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    }

    function handleChange(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    }

    return (
        <div className="mx-auto max-w-4xl px-4">
            {/* Mock browser window */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
                {/* Browser toolbar */}
                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/60" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                        <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="ml-auto text-xs text-slate-500 font-mono">
                        True Swing
                    </div>
                </div>

                {/*  Demo content - Upload preview */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-b-2xl shadow-lg">
                    <div className="flex flex-col items-center justify-center py-10 sm:py-12">
                        {/* Upload icon */}
                        <div className="mb-4">
                            <svg
                                className="h-12 w-12 sm:h-14 sm:w-14 text-emerald-400/60"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                />
                            </svg>
                        </div>

                        {/* Text content */}
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-100 text-center mb-1">
                            Upload your video
                        </h3>
                        <p className="text-slate-400 text-center text-sm max-w-xs mb-6">
                            Drag and drop or click to select your file. Supports MP4, MOV, and more.
                        </p>

                        {/* Upload area */}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleChange}
                            className="hidden"
                        />
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`rounded-lg border-2 border-dashed px-6 py-4 sm:px-8 sm:py-6 cursor-pointer transition-all ${
                                isDragging
                                    ? 'border-emerald-400/60 bg-emerald-400/10'
                                    : 'border-slate-600/50 hover:border-slate-600/70 hover:bg-slate-700/10'
                            }`}
                        >
                            <p className="text-slate-300 text-sm font-medium">
                                Click or drag video here
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <p className="mt-4 text-sm text-red-400">{error}</p>
                        )}

                        {/* Feature hints */}
                        <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
                            <div>
                                <p className="text-emerald-400/80 text-xs font-semibold">Fast</p>
                                <p className="text-slate-500 text-[11px] mt-0.5">Results in 2 min</p>
                            </div>
                            <div>
                                <p className="text-emerald-400/80 text-xs font-semibold">Private</p>
                                <p className="text-slate-500 text-[11px] mt-0.5">Auto-deleted</p>
                            </div>
                            <div>
                                <p className="text-emerald-400/80 text-xs font-semibold">AI-Powered</p>
                                <p className="text-slate-500 text-[11px] mt-0.5">Pro insights</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}