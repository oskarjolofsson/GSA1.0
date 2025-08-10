import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import '../styles/VideoUpload.css';

// VideoUpload component allows users to upload a video file for analysis
export default function VideoUpload() {
    // State to store the selected file
    const [file, setFile] = useState(null);
    // State to indicate if upload is in progress
    const [uploading, setUploading] = useState(false);
    // State to display messages to the user
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Add this line

    // Handles file input change event
    const handleFileChange = (e) => {
        setFile(e.target.files[0]); // Store the selected file in state
    };

    // Handles form submission for uploading the video
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        if (!file) {
            setMessage('Please select a video file.'); // Prompt user to select a file
            return;
        }
        setUploading(true); // Set uploading state to true
        setMessage(''); // Clear any previous messages
        const formData = new FormData();
        formData.append('video', file); // Append the selected file to form data
        try {
            // Send POST request to backend upload endpoint
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                setMessage('Upload successful!'); // Notify user of success
                // Redirect to results page, e.g. '/results'
                navigate('/results');
            } else {
                setMessage('Upload failed.'); // Notify user of failure
            }
        } catch (error) {
            setMessage('An error occurred.'); // Notify user of error
        }
        setUploading(false); // Reset uploading state
    };

    // Render the upload form and messages
    return (    
        <div className='upload-container'>
            <h2>Upload Your Swing</h2>
            <form onSubmit={handleSubmit}>
                {/* File input for selecting video */}
                <input type='file' accept='video/*' onChange={handleFileChange} />
                {/* Submit button, disabled while uploading */}
                <button type='submit' disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
            </form>
            {/* Display message if present */}
            {message && <p className='description'>{message}</p>}
            {/* Description for the tool */}
            <p className='description'>
                This AI-powered tool analyzes your golf swing and provides with analysis and drills.
            </p>
        </div>
    );
}