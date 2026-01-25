import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileTransferService } from '../../../services/fileTransferService';

export default function SimpleUploadCard() {
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
        if (!file.type.startsWith('video/')) {
            setError('Please select a video file');
            return;
        }

        setError('');
        fileTransferService.setFile(file);
        navigate('/dashboard/upload');
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-xl p-8">
            
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_60%)]" />

            <div className="relative">
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
                    className={`rounded-lg border-2 border-dashed px-6 py-12 cursor-pointer transition-all text-center ${
                        isDragging
                            ? 'border-emerald-400/60 bg-emerald-400/10'
                            : 'border-slate-600/50 hover:border-slate-600/70 hover:bg-slate-700/10'
                    }`}
                >
                    <svg
                        className="h-10 w-10 text-slate-400 mx-auto mb-3"
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
                    <p className="text-slate-300 font-medium">Drag and drop or click to upload</p>
                    <p className="text-slate-500 text-sm mt-1">MP4, MOV, and more</p>
                </div>

                {error && (
                    <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
                )}
            </div>
        </div>
    );
}
